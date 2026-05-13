import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  return {
    session,
    user,
    ready,
    loading: !ready,
  };
}

export default useAuth;
