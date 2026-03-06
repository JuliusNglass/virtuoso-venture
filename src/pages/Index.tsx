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
      // Check owned demo studio
      if (ownedStudio?.is_demo) { navigate("/dashboard", { replace: true }); return; }
      // Check linked demo studio via roles
      const linkedStudioIds = (roleRows ?? []).map(r => r.studio_id).filter(Boolean) as string[];
      if (linkedStudioIds.length > 0) {
        const { data: demoStudio } = await supabase
          .from("studios").select("id, is_demo").in("id", linkedStudioIds).eq("is_demo", true).maybeSingle();
        if (demoStudio) { navigate("/dashboard", { replace: true }); return; }
      }
      if (roles.includes("parent") && !roles.includes("admin") && !ownedStudio) { navigate("/parent", { replace: true }); return; }
      if (!ownedStudio) { navigate("/onboarding", { replace: true }); return; }
      navigate("/dashboard", { replace: true });
    })();
  }, [user, loading, navigate]);

  return null;
};

export default Index;
