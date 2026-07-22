import type { ReactNode } from "react";

import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Footer row, e.g. "Don't have an account? Sign up". */
  footer?: ReactNode;
  /** The Flutter screens offer a Skip that drops the user on the home page. */
  showSkip?: boolean;
}

/**
 * Shared chrome for every auth route, matching the Flutter auth screens
 * (hypercommerce-customer-app/lib/screens/auth/view/): a subtle top-left to
 * bottom-right primary gradient, an optional Skip in the top right, then a
 * large welcome heading over the form.
 *
 * Mobile renders edge-to-edge like the app; from tablet up the form is capped
 * and centred so it doesn't stretch across a desktop viewport.
 */
const AuthShell = ({
  title,
  subtitle,
  children,
  footer,
  showSkip = true,
}: AuthShellProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="relative min-h-dvh bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-primary/15"
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-7 pt-2">
        {showSkip ? (
          <div className="flex justify-end">
            <Button
              className="h-auto min-w-0 bg-transparent px-2 py-1 text-small font-semibold text-default-500"
              size="sm"
              variant="light"
              onPress={() => router.push("/")}
            >
              {t("auth.skip")}
            </Button>
          </div>
        ) : null}

        <div className="mt-2.5">
          <h1 className="text-[26px] font-extrabold -tracking-[0.5px] text-foreground md:text-[34px]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-small text-default-500">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-6 flex-1">{children}</div>

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
};

export default AuthShell;
