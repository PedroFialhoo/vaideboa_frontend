import "@/global.css";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { useChat } from "@/src/hooks/use-chat";
import { horarioMensagem, Mensagem } from "@/src/services/chat";

export default function Chat() {
  const params = useLocalSearchParams<{ idReserva: string; idCarona: string; nome?: string }>();
  const router = useRouter();
  const chat = useChat(Number(params.idReserva), Number(params.idCarona));
  const [text, setText] = useState("");
  const list = useRef<FlatList<Mensagem>>(null);
  const nearEnd = useRef(true);
  const previousNewest = useRef<number | undefined>(undefined);
  async function send() {
    const draft = text;
    if (await chat.enviar(draft)) { setText(current => current === draft ? "" : current); nearEnd.current = true; list.current?.scrollToOffset({ offset: 0, animated: true }); }
  }
  return <SafeAreaView className="flex-1 bg-velvet-orchid-900">
    <KeyboardAvoidingView className="flex-1 bg-vintage-grape-200" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View className="px-5 pb-4 bg-velvet-orchid-900">
        <TouchableOpacity accessibilityRole="button" onPress={() => router.back()}><Text className="text-white font-bold">‹ Voltar</Text></TouchableOpacity>
        <Text className="text-white text-xl font-black mt-3">{params.nome || "Conversa da reserva"}</Text>
        <Text className="text-purple-x11-200 mt-1">{chat.status}</Text>
        {chat.recovering && <Text className="text-purple-x11-200 text-xs mt-1">Sincronizando histórico...</Text>}
      </View>
      {!!chat.error && <View className="p-4 bg-platinum-50"><Text accessibilityRole="alert" className="text-velvet-orchid-900">{chat.error}</Text><Button onPress={() => void chat.sincronizar()} className="mt-2 bg-velvet-orchid-700"><ButtonText>Sincronizar histórico</ButtonText></Button></View>}
      {chat.loading && <ActivityIndicator accessibilityLabel="Carregando conversa" className="my-4" />}
      <FlatList ref={list} className="flex-1" inverted data={[...chat.mensagens].reverse()} keyExtractor={m => String(m.id)}
        keyboardShouldPersistTaps="handled" maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        onScroll={event => { nearEnd.current = event.nativeEvent.contentOffset.y < 100; }} scrollEventThrottle={16}
        onContentSizeChange={() => {
          const newest = chat.mensagens.at(-1)?.id;
          if (newest !== previousNewest.current && nearEnd.current) list.current?.scrollToOffset({ offset: 0, animated: true });
          previousNewest.current = newest;
        }}
        ListEmptyComponent={!chat.loading ? <Text className="text-center text-velvet-orchid-900 p-8">Nenhuma mensagem ainda. Comece a conversa!</Text> : null}
        ListFooterComponent={chat.hasOlder ? <Button isDisabled={chat.olderLoading} onPress={() => void chat.carregarAntigas()} className="m-4 bg-velvet-orchid-700">{chat.olderLoading && <ButtonSpinner />}<ButtonText>Carregar mensagens antigas</ButtonText></Button> : null}
        renderItem={({ item }) => {
          const own = item.idAutor === chat.idUsuario;
          return <View className={`mx-4 my-1 p-3 rounded-2xl max-w-[85%] ${own ? "self-end bg-velvet-orchid-700" : "self-start bg-platinum-50"}`}>
            <Text className={own ? "text-purple-x11-100 font-bold text-xs" : "text-velvet-orchid-700 font-bold text-xs"}>{own ? "Você" : params.nome || "Participante"}</Text>
            <Text selectable className={`mt-1 ${own ? "text-white" : "text-velvet-orchid-900"}`}>{item.mensagem}</Text>
            <Text className={`mt-2 text-xs ${own ? "text-purple-x11-100" : "text-velvet-orchid-700"}`}>{horarioMensagem(item.enviadoEm)}</Text>
          </View>;
        }} />
      <View className="p-4 bg-platinum-50 border-t border-purple-x11-100">
        {!!chat.sendError && <Text accessibilityRole="alert" className="text-velvet-orchid-900 mb-2">{chat.sendError}</Text>}
        <Input className="h-auto min-h-12 rounded-2xl border-purple-x11-200"><InputField accessibilityLabel="Mensagem" placeholder="Escreva uma mensagem..." value={text} onChangeText={setText} multiline maxLength={1000} editable={!chat.sending} className="text-velvet-orchid-900 py-3" /></Input>
        <View className="flex-row justify-between items-center mt-2"><Text className="text-velvet-orchid-700 text-xs">{text.length}/1000</Text><Button isDisabled={chat.sending || !text.trim()} onPress={() => void send()} className="bg-velvet-orchid-700 rounded-2xl">{chat.sending && <ButtonSpinner />}<ButtonText className="text-white">{chat.sending ? "Enviando..." : "Enviar"}</ButtonText></Button></View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
