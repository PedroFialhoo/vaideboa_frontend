import axios from "axios"

export const api = axios.create({
  //baseURL: "http://localhost:8080",
  //baseURL: "http://172.20.10.2:8080"  //CONECTADO NO MEU WIFI 4G/NOTEBOOK
  baseURL: "http://10.216.175.231:8080",  //CONECTADO NO MEU PC
  //baseURL: "http://192.168.68.110:8080" //CONECTADO NO DECO/NOTEBOOK
})