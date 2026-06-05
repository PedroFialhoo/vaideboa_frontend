import { Redirect, useRouter } from "expo-router";
import { getToken } from "../services/storage";
import { useEffect } from "react";
import { api } from "../services/api";

export default function Index() {
  const router = useRouter()
  const checkToken = async () => {
    const token = await getToken()
    if(token){
      api.get('/validarToken', {
        params: { token }
      })
      .then(response => {
        console.log('Token válido:', response.data)
        if(response.data){
          console.log("Token encontrado e validado, redirecionando para home")
          router.replace("/home")
        }
        else{
          console.log("Token inválido, redirecionando para o login")
          router.replace("/login")
        }
      })      
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