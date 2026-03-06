import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }

    (async () => {
      const [{ data: roleRows }, { data: studioData }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("studios").select("id, is_demo").eq("owner_user_id", user.id).maybeSingle(),
      ]);
      const roles = roleRows?.map(r => r.role) ?? [];
      if (studioData?.is_demo) { navigate("/dashboard", { replace: true }); return; }
      if (roles.includes("parent") && !roles.includes("admin") && !studioData) { navigate("/parent", { replace: true }); return; }
      if (!studioData) { navigate("/onboarding", { replace: true }); return; }
      navigate("/dashboard", { replace: true });
    })();
  }, [user, loading, navigate]);

  return null;
};

export default Index;
