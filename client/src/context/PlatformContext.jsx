import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/client.js";

// Public platform switches set by the super admin (registration, Google sign-in, site banner…)
const DEFAULTS = {
  platformName: "Ridgeline",
  registrationOpen: true,
  googleSignInEnabled: true,
  instructorSignupEnabled: false,
  instructorsCanPublish: true,
  allowLateSubmissions: true,
  banner: null,
};

const PlatformContext = createContext({ platform: DEFAULTS, reloadPlatform: () => {} });

export const PlatformProvider = ({ children }) => {
  const [platform, setPlatform] = useState(DEFAULTS);

  const reloadPlatform = useCallback(async () => {
    try {
      const { data } = await api.get("/settings/public");
      setPlatform({ ...DEFAULTS, ...data });
    } catch {
      /* keep defaults if the API is unreachable */
    }
  }, []);

  useEffect(() => {
    reloadPlatform();
  }, [reloadPlatform]);

  useEffect(() => {
    document.title = platform.platformName;
  }, [platform.platformName]);

  return <PlatformContext.Provider value={{ platform, reloadPlatform }}>{children}</PlatformContext.Provider>;
};

export const usePlatform = () => useContext(PlatformContext);
