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
      const [rolesResult, studioResult] = await Promise.all([
        supabase.from("user_roles").select("role, studio_id").eq("user_id", user.id),
        supabase.from("studios").select("id, is_demo").eq("owner_user_id", user.id).maybeSingle(),
      ]);

      // If queries errored out, don't accidentally send user to onboarding — retry via dashboard
      if (rolesResult.error || studioResult.error) {
        console.warn("Index routing query error, defaulting to dashboard", rolesResult.error, studioResult.error);
        navigate("/dashboard", { replace: true });
        return;
      }

      const roles = rolesResult.data?.map(r => r.role) ?? [];
      const ownedStudio = studioResult.data;
      const isAdmin = roles.includes("admin");
      const linkedStudioId = rolesResult.data?.find(r => r.studio_id)?.studio_id;
      const hasAnyStudio = !!ownedStudio || !!linkedStudioId;

      const isParentOnly = roles.includes("parent") && !isAdmin && !hasAnyStudio;

      if (isParentOnly) { navigate("/parent", { replace: true }); return; }
      if (isAdmin || hasAnyStudio) { navigate("/dashboard", { replace: true }); return; }
      navigate("/onboarding", { replace: true });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, loading]);

  return null;
};

export default Index;
