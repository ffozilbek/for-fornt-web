import { api } from "./api";

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const backendMessage =
      error.response?.data?.message || error.response?.data?.error;

    if (backendMessage) {
      return Promise.reject(new Error(backendMessage));
    }

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
      friendlyMessage = "Server bilan aloqa uzildi. Backend ishlamayapti.";
    }

    return Promise.reject(new Error(friendlyMessage));
  },
);
