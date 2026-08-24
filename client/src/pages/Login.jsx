import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { validateLoginForm } from "../utils/Validators";

export const Login = () => {
  const navigate = useNavigate();

  const {
    login,
    isLoading,
    error: authError,
    setError: setAuthError,
  } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (authError) setAuthError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateLoginForm(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const result = await login({ ...formData, rememberMe });
      navigate(result.user?.role === "admin" ? "/admin-dashboard" : "/", { replace: true });
    } catch {
      // authError already set by useAuth
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0B1F17] font-sans">
      {/* ============ LEFT PANEL — LEDGER ============ */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-[#0B1F17] relative px-16 py-14 overflow-hidden">
        {/* Faint horizontal ledger rules, like ruled paper */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0, transparent 39px, #C9A227 39px, #C9A227 40px)",
          }}
        />

        {/* Top: wordmark */}
        <div className="relative z-10">
            <div className="flex flex-col items-center gap-3 text-center mt-50">
            {/* <div className="flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
              <img src="/image.png" alt="DM Websoft logo" className="h-full w-full object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.28)]" />
            </div> */}
            <div>
              <p className="text-[#F7F4EC] font-serif text-5xl tracking-wide leading-none">
                DM Websoft
              </p>
              <p className="text-[#8A8273] text-[1rem] tracking-[0.2em] uppercase mt-1">
                Mini HRMS System
              </p>
            </div>
          </div>
        </div>

        {/* Middle: headline + features, set like a ledger entry */}
        {/* <div className="relative z-10 max-w-md">
          <p className="font-mono text-[#C9A227] text-xs tracking-[0.25em] uppercase mb-6">
           
          </p>

          <h1 className="font-serif text-[#F7F4EC] text-[2.75rem] leading-[1.15]">
            Every invoice,
            <br />
            accounted for.
          </h1>

          <p className="mt-6 text-[#C9C4B4] text-base leading-relaxed font-light">
            A single ledger for billing, payments, and client history —
            built for finance teams who keep precise books.
          </p>

          <div className="mt-10 border-t border-[#C9A227]/25">
            {[
              ["Issue", "Invoices generated and sent in seconds"],
              ["Reconcile", "Payment status tracked in real time"],
              ["Report", "Financial summaries, exported on demand"],
            ].map(([term, desc]) => (
              <div
                key={term}
                className="flex items-baseline gap-6 py-4 border-b border-[#C9A227]/25"
              >
                <span className="font-mono text-[#C9A227] text-xs tracking-[0.15em] uppercase w-20 shrink-0">
                  {term}
                </span>
                <span className="text-[#C9C4B4] text-sm">{desc}</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Bottom: quiet trust line */}
        <p className="item-center align-center text-center relative z-10 text-[#6B6757] text-xs font-mono tracking-wide">
            © All Rights Reserverd by Dhiren Makwana
        </p>
      </div>

      {/* ============ RIGHT PANEL — FORM ============ */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 bg-[#F7F4EC]">
        <div className="w-full max-w-[420px]">
          {/* Mobile-only wordmark (left panel is hidden below lg) */}
          <div className="mb-10 flex flex-col items-center justify-center gap-3 text-center lg:hidden">
            <div className="flex h-20 w-20 items-center justify-center border border-[#C9A227]/50 bg-[#0B1F17] shadow-lg">
              <img src="/image.png" alt="DM Websoft logo" className="h-16 w-16 object-contain" />
            </div>
            <div>
              <p className="font-serif text-[#1C3829] text-lg leading-none">
                DM Websoft
              </p>
              <p className="text-[#8A8273] text-[10px] tracking-[0.2em] uppercase mt-1">
                Mini HRMS System
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E3DECF] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {/* Brass top rule — the one bold flourish */}
            <div className="h-[3px] bg-[#C9A227]" />

            <div className="p-7 sm:p-10">
              <p className="font-mono text-[#A8945A] text-[11px] tracking-[0.25em] uppercase">
                Account access
              </p>
              <h2 className="font-serif text-[#1C2620] text-[1.6rem] mt-2 leading-tight">
                Sign in to Mini HRMS
              </h2>
              <p className="mt-2 text-[#7A7565] text-sm">
                Enter your credentials to continue.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-2.5 border border-[#E0B4AC] bg-[#FBF0EE] px-4 py-3 text-sm text-[#8A3C2F]"
                >
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-xs font-medium tracking-wide uppercase text-[#5C5747]"
                  >
                    Email address
                  </label>
                  <div className="mt-2 relative">
                    <Mail
                      size={16}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[#A39C87]"
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleChange("email")}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={fieldErrors.email ? "email-error" : undefined}
                      className={`w-full bg-transparent border-0 border-b py-2.5 pl-6 pr-2 text-[15px] text-[#1C2620] outline-none transition-colors placeholder:text-[#B7B19F] ${
                        fieldErrors.email
                          ? "border-[#C75B4A] focus:border-[#C75B4A]"
                          : "border-[#D8D2C0] focus:border-[#1C3829]"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p id="email-error" className="mt-1.5 text-xs text-[#A03B2A]">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs font-medium tracking-wide uppercase text-[#5C5747]"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-[#8A6D1F] hover:text-[#C9A227] transition-colors"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="mt-2 relative">
                    <Lock
                      size={16}
                      className="absolute left-0 top-1/2 -translate-y-1/2 text-[#A39C87]"
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                      value={formData.password}
                      onChange={handleChange("password")}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby={fieldErrors.password ? "password-error" : undefined}
                      className={`w-full bg-transparent border-0 border-b py-2.5 pl-6 pr-8 text-[15px] text-[#1C2620] outline-none transition-colors placeholder:text-[#B7B19F] ${
                        fieldErrors.password
                          ? "border-[#C75B4A] focus:border-[#C75B4A]"
                          : "border-[#D8D2C0] focus:border-[#1C3829]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-[#A39C87] hover:text-[#1C3829] p-1"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p id="password-error" className="mt-1.5 text-xs text-[#A03B2A]">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <label
                  htmlFor="remember-me"
                  className="flex items-center gap-2.5 text-sm text-[#5C5747] pt-1 cursor-pointer select-none"
                >
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded-none border-[#C9C2AC] text-[#1C3829] focus:ring-1 focus:ring-[#1C3829] focus:ring-offset-0"
                  />
                  Keep me signed in
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1C3829] text-[#F7F4EC] py-3.5 text-sm font-medium tracking-wide uppercase transition-colors hover:bg-[#15291E] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading && <Loader2 size={16} className="animate-spin" />}
                  {isLoading ? "Signing in" : "Sign in"}
                </button>
              </form>

              {/* Divider */}
              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E3DECF]" />
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#A39C87]">
                  Or
                </span>
                <div className="h-px flex-1 bg-[#E3DECF]" />
              </div>

              {/* Google */}
              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 border border-[#D8D2C0] py-3 text-sm text-[#3A3527] font-medium hover:bg-[#F7F4EC] transition-colors"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt=""
                  className="h-4 w-4"
                />
                Continue with Google
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;