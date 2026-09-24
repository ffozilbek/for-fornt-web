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
    // Backenddan kelgan JSON xabar (masalan: {"message": "Noto'g'ri parol"})
    const message =
      error.response?.data?.message ||
      error.message ||
      "Server bilan aloqa uzildi.";

    // Har doim toza xato matni bilan rad etamiz
    return Promise.reject(new Error(message));
  },
);
