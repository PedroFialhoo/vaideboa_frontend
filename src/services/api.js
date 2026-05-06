import axios from "axios"

export const api = axios.create({
  //baseURL: "http://localhost:8080",
  //baseURL: "http://172.22.191.224:8080"  //CONECTADO NO MEU WIFI 4G/NOTEBOOK
  baseURL: "http://192.168.0.135:8080",  //CONECTADO NO MEU PC
})