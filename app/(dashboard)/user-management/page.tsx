import { redirect } from "next/navigation";

// foydalanuvchilar boshqaruvi /account sahifasiga ko'chirildi
export default function UserManagement() {
  redirect("/account");
}
