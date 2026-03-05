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
    const { data } = await supabase
      .from("studios")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setStudio(data ?? null);
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
