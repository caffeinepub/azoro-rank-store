import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AdminPage from "./pages/AdminPage";
import HomePage from "./pages/HomePage";

type Page = "home" | "admin";

function getPage(): Page {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "admin";
  const hash = window.location.hash;
  if (hash.startsWith("#/admin")) return "admin";
  return "home";
}

export default function App() {
  const [page, setPage] = useState<Page>(getPage);

  useEffect(() => {
    const handlePopState = () => setPage(getPage());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <>
      {page === "admin" ? <AdminPage /> : <HomePage />}
      <Toaster richColors position="top-center" />
    </>
  );
}
