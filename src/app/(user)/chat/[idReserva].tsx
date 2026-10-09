import "@/global.css";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Send, Wifi } from "lucide-react-native";
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useState } from "react";
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
  const name = params.nome || "Participante";
  const initial = name.trim().charAt(0).toUpperCase() || "C";
  const connected = chat.status === "Conectado";

  async function send() {
    const draft = text;
    if (await chat.enviar(draft)) {
      setText(current => current === draft ? "" : current);
      nearEnd.current = true;
      list.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }

  return (
      <KeyboardAvoidingView
        className="flex-1 bg-platinum"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View className="bg-velvet-orchid-900 px-5 pt-10 pb-2 border-b border-velvet-orchid-700 z-10">
          <View className="flex-row items-center">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              onPress={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/10 items-center justify-center mr-3"
            >
              <ArrowLeft size={21} color="white" />
            </TouchableOpacity>
            <View className="w-10 h-10 rounded-xl bg-purple-x11-500 items-center justify-center border border-purple-x11-300 mr-3">
              <Text className="text-white font-black text-lg">{initial}</Text>
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-white text-base font-black">{params.nome || "Conversa da reserva"}</Text>
              <View className="flex-row items-center mt-0.5">
                <View className={`w-2 h-2 rounded-full mr-1.5 ${connected ? "bg-green-400" : "bg-purple-x11-200"}`} />
                <Text className="text-purple-x11-100 text-xs font-semibold">{chat.status}</Text>
              </View>
            </View>
          </View>
          {chat.recovering && (
            <View className="mt-2 flex-row items-center self-start bg-white/10 px-3 py-1.5 rounded-full">
              <Wifi size={13} color="#e9d4ff" />
              <Text className="text-purple-x11-100 text-xs font-semibold ml-1.5">Sincronizando mensagens</Text>
            </View>
          )}
        </View>

        {!!chat.error && (
          <View className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
            <Text accessibilityRole="alert" className="text-red-700 font-semibold text-sm">{chat.error}</Text>
            <TouchableOpacity onPress={() => void chat.sincronizar()} className="self-start mt-3 bg-red-100 px-3 py-2 rounded-xl">
              <Text className="text-red-700 font-black text-xs">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {chat.loading && <ActivityIndicator accessibilityLabel="Carregando conversa" className="my-5" color="#7b4d91" />}

        <View className="flex-1 overflow-hidden">
          <View pointerEvents="none" className="absolute self-center w-full h-full opacity-[0.1] pr-3">
            <Image source={require("../../../assets/images/logo-vdb.png")} resizeMode="contain" className="w-full h-full" />
          </View>
          <FlatList
            ref={list}
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 18, flexGrow: 1 }}
            inverted
            data={[...chat.mensagens].reverse()}
            keyExtractor={message => String(message.id)}
            keyboardShouldPersistTaps="handled"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onScroll={event => { nearEnd.current = event.nativeEvent.contentOffset.y < 100; }}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              const newest = chat.mensagens.at(-1)?.id;
              if (newest !== previousNewest.current && nearEnd.current) list.current?.scrollToOffset({ offset: 0, animated: true });
              previousNewest.current = newest;
            }}
            ListEmptyComponent={!chat.loading ? (
              <View className="flex-1 items-center justify-center px-8">
                <View className="w-14 h-14 rounded-3xl bg-purple-x11-100 items-center justify-center mb-4">
                  <Send size={23} color="#7b4d91" />
                </View>
                <Text className="text-velvet-orchid-900 font-black text-base text-center">A conversa começa aqui</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">Envie uma mensagem para combinar os detalhes da carona.</Text>
              </View>
            ) : null}
            ListFooterComponent={chat.hasOlder ? (
              <TouchableOpacity disabled={chat.olderLoading} onPress={() => void chat.carregarAntigas()} className="self-center mt-4 mb-3 bg-purple-x11-100 px-4 py-2.5 rounded-full">
                {chat.olderLoading ? <ActivityIndicator size="small" color="#7b4d91" /> : <Text className="text-purple-x11-700 font-black text-xs">Carregar mensagens anteriores</Text>}
              </TouchableOpacity>
            ) : null}
            renderItem={({ item }) => {
              const own = item.idAutor === chat.idUsuario;
              return (
                <View className={`my-1.5 max-w-[82%] ${own ? "self-end" : "self-start"}`}>
                  {!own && <Text className="text-velvet-orchid-700 font-black text-[11px] mb-1 ml-1">{name}</Text>}
                  <View className={`px-4 py-3 ${own ? "bg-velvet-orchid-700 rounded-3xl rounded-br-md" : "bg-white border border-purple-x11-100 rounded-3xl rounded-bl-md shadow-sm"}`}>
                    <Text selectable className={`text-[15px] leading-5 ${own ? "text-white" : "text-velvet-orchid-900"}`}>{item.mensagem}</Text>
                    <Text className={`text-[10px] font-semibold mt-1.5 ${own ? "text-purple-x11-100 text-right" : "text-gray-400"}`}>{horarioMensagem(item.enviadoEm)}</Text>
                  </View>
                </View>
              );
            }}
          />
        </View>

        <View className="bg-velvet-orchid-900 border-t border-velvet-orchid-700 px-4 pt-3 pb-14">
          {!!chat.sendError && <Text accessibilityRole="alert" className="text-red-300 text-xs font-semibold mb-2">{chat.sendError}</Text>}
          <View className="flex-row items-end">
            <Input className="flex-1 min-h-12 h-auto rounded-2xl bg-white/10 border-velvet-orchid-700 mr-2">
              <InputField accessibilityLabel="Mensagem" placeholder="Escreva uma mensagem..." placeholderTextColor="#d8b4fe" value={text} onChangeText={setText} multiline maxLength={1000} editable={!chat.sending} className="text-white py-3" />
            </Input>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem"
              disabled={chat.sending || !text.trim()}
              onPress={() => void send()}
              className={`w-12 h-12 rounded-2xl items-center justify-center ${chat.sending || !text.trim() ? "bg-purple-x11-100" : "bg-velvet-orchid-700"}`}
            >
              {chat.sending ? <ActivityIndicator size="small" color="white" /> : <Send size={19} color={text.trim() ? "white" : "#7b4d91"} />}
            </TouchableOpacity>
          </View>
          <Text className="text-purple-x11-200 text-[10px] text-right mt-1.5 mr-1">{text.length}/1000</Text>
        </View>
      </KeyboardAvoidingView>
  );
}
