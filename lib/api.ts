import axios from "axios";

export const api = axios.create({
  baseURL: "", // Bo'sh qolsa nisbiy (/api/...) ishlaydi
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
