import { Button, ButtonText } from "@/components/ui/button";
import { reservaValida } from "@/src/services/chat";
import { Href, useRouter } from "expo-router";

export default function ChatButton({ idReserva, idCarona, nome }: { idReserva?: number; idCarona: number; nome?: string }) {
  const router = useRouter();
  if (!idReserva || !reservaValida(idReserva)) return null;
  // Metro atualiza os tipos de rotas gerados ao descobrir a nova tela.
  const href = `/chat/${idReserva}?idCarona=${idCarona}${nome ? `&nome=${encodeURIComponent(nome)}` : ""}` as Href;
  return <Button accessibilityLabel={`Abrir chat${nome ? ` com ${nome}` : ""}`} className="bg-velvet-orchid-700 rounded-2xl mt-3" onPress={() => router.push(href)}>
    <ButtonText className="text-white">Abrir chat</ButtonText>
  </Button>;
}
