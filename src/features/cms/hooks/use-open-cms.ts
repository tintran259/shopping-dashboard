import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth-store';
import { cmsApi } from '../api/cms-api';

/** Ghép URL auto-login: mở là CMS set cookie `jwtToken` rồi vào thẳng `/admin`. */
const ssoTarget = (ssoUrl: string, token: string) =>
  `${ssoUrl}?token=${encodeURIComponent(token)}`;

/**
 * Mở admin CMS (Strapi) trong cửa sổ mới, đã đăng nhập sẵn.
 *
 * Đường chính: token CMS đã được cấp kèm khi đăng nhập BO (`user.cms`), nên chỉ
 * cần `window.open` thẳng tới `/cms-sso?token=…` — cửa sổ mở ra là vào luôn
 * `/admin`, không có trang trung gian.
 *
 * Dự phòng: nếu lúc đăng nhập CMS chưa sẵn sàng (`user.cms == null`), xin token
 * ngay lúc bấm rồi mới điều hướng cửa sổ.
 */
export function useOpenCms() {
  const cms = useAuthStore((s) => s.user?.cms);

  const fallback = useMutation({
    mutationFn: () => cmsApi.loginToken(),
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : 'Không mở được CMS'),
  });

  const openCms = () => {
    // Đường chính — token có sẵn, mở thẳng trong click (không lo chặn popup).
    if (cms?.token) {
      window.open(ssoTarget(cms.ssoUrl, cms.token), 'cms-admin');
      return;
    }

    // Dự phòng — mở cửa sổ trước (tránh chặn popup), rồi xin token và điều hướng.
    const win = window.open('about:blank', 'cms-admin');
    if (!win) {
      toast.error('Trình duyệt đã chặn cửa sổ CMS. Cho phép popup rồi thử lại.');
      return;
    }
    fallback.mutate(undefined, {
      onSuccess: ({ token, ssoUrl }) => {
        win.location.href = ssoTarget(ssoUrl, token);
      },
      onError: () => win.close(),
    });
  };

  return { openCms, isPending: fallback.isPending };
}
