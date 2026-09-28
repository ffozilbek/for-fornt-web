import axios from "axios";

export const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. Backenddan kelgan JSON xabar bormi? (Flask ba'zan "message", ba'zan "error" kalitida beradi)
    const backendMessage =
      error.response?.data?.message || error.response?.data?.error;

    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }

    // 2. Agar backenddan xabar kelmasa, status kodiga qaraymiz:
    const status = error.response?.status;

    let friendlyMessage = "Server bilan aloqa uzildi.";

    if (status === 500) {
      friendlyMessage = "Serverda ichki xatolik yuz berdi (500).";
    } else if (status === 404) {
      friendlyMessage = "So'ralgan manzil topilmadi (404).";
    } else if (status === 403) {
      friendlyMessage = "Sizda ushbu amalni bajarish uchun ruxsat yo'q.";
    } else if (status === 401) {
      friendlyMessage = "Sessiya muddati tugagan.";
    } else if (!error.response) {
      // Backend umuman o'chiq bo'lsa (Network Error)
      friendlyMessage = "Server bilan aloqa uzildi. Backend ishlamayapti.";
    }

    return Promise.reject(new Error(friendlyMessage));
  },
);
