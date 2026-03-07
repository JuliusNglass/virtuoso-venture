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
      const [{ data: roleRows }, { data: ownedStudio }] = await Promise.all([
        supabase.from("user_roles").select("role, studio_id").eq("user_id", user.id),
        supabase.from("studios").select("id, is_demo").eq("owner_user_id", user.id).maybeSingle(),
      ]);
      const roles = roleRows?.map(r => r.role) ?? [];
      const isAdmin = roles.includes("admin");
      const isParentOnly = roles.includes("parent") && !isAdmin && !ownedStudio;

      if (isParentOnly) { navigate("/parent", { replace: true }); return; }
      if (isAdmin || ownedStudio) { navigate("/dashboard", { replace: true }); return; }
      navigate("/onboarding", { replace: true });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  return null;
};

export default Index;
