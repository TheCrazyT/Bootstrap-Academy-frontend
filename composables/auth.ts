import { GET, POST } from "./fetch";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

export const useOauthProviders = () => useState("oauthProviders", () => []);

export async function getOAuthProviders() {
  try {
    const response = await GET("/auth/oauth/providers");

    const oauthProviders = useOauthProviders();
    oauthProviders.value = response ?? [];

    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}

export async function loginViaOAuthProvider(body: any) {
  try {
    const response = await POST(`/auth/sessions/oauth`, body);

    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}

export async function refresh() {
  const config = useRuntimeConfig().public;
  const refreshToken = getRefreshToken();

  let body = JSON.stringify({ refresh_token: refreshToken });

  try {
    const response = await $fetch(`${config.BASE_API_URL}/auth/session`, {
      method: "PUT",
      body: body,
    });

    setStates(response);
    return [response, null];
  } catch (error: any) {
    setStates(null);
    return [null, error.data];
  }
}

export async function logout() {
  const user = <any>useUser();

  try {
    if (!!!user.value || !!!user.value.id) {
      throw { data: "Invalid User Id" };
    }

    const response = await DELETE(`/auth/sessions/${user.value.id}`);

    setStates(null);

    // Calendar Composable
    const calendar = useCalendar();
    calendar.value = null;
    const ics = useICS();
    ics.value = "";
    const events = useEvents();
    events.value = [];
    const eventFilter = useEventFilter();
    eventFilter.value = "all";

    // Coaching Composable
    const coachings = useCoachings();
    coachings.value = [];

    // Coins Composable
    const coins = useCoins();
    coins.value = 0;
    const paypalClientID = usePaypalClientID();
    paypalClientID.value = "";

    // Course Composable
    const myCourses = useMyCourses();
    myCourses.value = [];
    const courses = useCourses();
    courses.value = [];
    const course = useCourse();
    course.value = null;
    const videoSRC = useVideoSRC();
    videoSRC.value = "";

    // Jobs Composable
    const job = useJob();
    job.value = null;
    const jobs = useJobs();
    jobs.value = [];

    // Ratings Composable
    const unratedWebinars = useUnratedWebinars();
    unratedWebinars.value = [];

    // Webinars Composable
    const webinar = useWebinar();
    webinar.value = null;
    const webinars = useWebinars();
    webinars.value = [];
    const myWebinars = useMyWebinars();
    myWebinars.value = [];

    // XP Composable
    const xp = useXP();
    xp.value = 0;

    return [response, null];
  } catch (error) {
    return [null, error];
  }
}

export async function login(body: any) {
  try {
    const response = await POST("/auth/sessions", body);
    setStates(response);
    // await getPremiumStatus()
    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}

export async function loginWithWebAuthn(username: string){
  try {
    const response = await GET(`/auth/generate-authentication-options?user=${username}`);
    if(response?.challenge){
      const attResp  = await startAuthentication(response);
      const attBody:any = attResp;
      delete attBody.clientExtensionResults;
      const verificationResp = await POST('/auth/verify-authentication', attBody);
      if (!verificationResp.credentialId) {
        throw { data: { detail: 'Not verified!' } };
      }
      //TODO: verificationResp should contain info about the login
      setStates(verificationResp);
      return [true, null];
    } else {
      throw { data: { detail: 'Unknown error during webAuthn' } };
    }
    return [false, null];
  } catch (error: any) {
    return [false, error];
  }
}

export async function registerWebAuthn(username: string) {
  let response;
  try {
    response = await GET(`/auth/generate-registration-options?user=${username}`);
  } catch (error: any) {
    return [false, error];
  }
  try {
    if(response?.user){
      const webAuthnResponse = await startRegistration(response);
      const asseBody: any = webAuthnResponse;
      delete asseBody.response.authenticatorData;
      delete asseBody.response.publicKey;
      delete asseBody.response.publicKeyAlgorithm;
      delete asseBody.clientExtensionResults;
      const verifyResponse = await POST('/auth/verify-registration', asseBody);
      if (!verifyResponse.userVerified) {
        throw { data: { detail: 'Not verified!' } };
      }
      return [true, null];
    } else {
      throw { data: { detail: 'Unknown error during webAuthn' } };
    }
  } catch (error: any) {
    if(error.code == 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED'){
      // not an actual error, this can happen if you already registered the device once ...
      return [true, error];
    }
    return [false, error];
  }
 }
 
 export async function signup(body: any) {
  try {
    const response = await POST("/auth/users", body);

    setStates(response);

    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}

export async function requestEmailVerification() {
  const user = <any>useUser();
  let user_id = user?.value?.id ?? null;
  let user_email = user?.value?.email ?? null;
  let isAccountVerified = user?.value?.email_verified ?? false;

  if (isAccountVerified) return [true, null];

  try {
    if (!!!user_id) {
      throw { data: { detail: "Invalid User Id" } };
    }
    if (!!!user_email) {
      throw { data: { detail: "User does not have email" } };
    }

    const response = await POST(`/auth/users/${user_id}/email`);

    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}

export async function verifyAccount(body: any) {
  try {
    const response = await PUT(`/auth/users/me/email`, body);

    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}

export async function forgotPassword(body: any) {
  try {
    const response = await POST("/auth/password_reset", body);

    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}

export async function resetPassword(body: any) {
  try {
    const response = await PUT("/auth/password_reset", body);

    return [response, null];
  } catch (error: any) {
    return [null, error.data];
  }
}
