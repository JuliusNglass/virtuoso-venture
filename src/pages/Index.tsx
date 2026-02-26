import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
    }
  }, [user, loading, navigate]);
  
  return null;
};

export default Index;
