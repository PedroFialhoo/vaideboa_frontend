import { Redirect, useRouter } from "expo-router";
import { getToken } from "../services/storage";
import { useEffect } from "react";

export default function Index() {
  const router = useRouter()
  const checkToken = async () => {
    const token = await getToken()
    if(token){
      console.log("Token encontrado, redirecionando para home")
      router.replace("/home")
    }
    else{
      console.log("Token não encontrado, redirecionando para o login")
      router.replace("/login")
    }
  }
  useEffect(() => {
    checkToken()
  }, [])
}