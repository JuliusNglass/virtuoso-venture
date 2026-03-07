import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Studio {
  id: string;
  name: string;
  slug: string | null;
  owner_user_id: string;
  created_at: string;
}

interface StudioContextType {
  studio: Studio | null;
  loading: boolean;
  refetch: () => void;
}

const StudioContext = createContext<StudioContextType>({
  studio: null,
  loading: true,
  refetch: () => {},
});

export const StudioProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudio = async () => {
    if (!user) {
      setStudio(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // First try: studio owned by user
    const { data: ownedStudio } = await supabase
      .from("studios")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (ownedStudio) {
      setStudio(ownedStudio);
      setLoading(false);
      return;
    }

    // Fallback: studio linked via user_roles (e.g. demo/invited admin)
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("studio_id")
      .eq("user_id", user.id)
      .not("studio_id", "is", null)
      .limit(1);

    const studioId = roleRows?.[0]?.studio_id;
    if (studioId) {
      const { data: linkedStudio } = await supabase
        .from("studios")
        .select("*")
        .eq("id", studioId)
        .maybeSingle();
      setStudio(linkedStudio ?? null);
    } else {
      setStudio(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <StudioContext.Provider value={{ studio, loading, refetch: fetchStudio }}>
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => useContext(StudioContext);
