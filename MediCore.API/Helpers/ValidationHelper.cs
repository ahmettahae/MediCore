using System.Text.RegularExpressions;

namespace MediCore.API.Helpers
{
    public static class ValidationHelper
    {
        public static bool IsValidTcKimlikNo(string? tc)
        {
            if (string.IsNullOrWhiteSpace(tc)) return false;
            tc = tc.Trim();
            if (tc.Length != 11) return false;
            if (!tc.All(char.IsDigit)) return false;
            if (tc[0] == '0') return false;

            int[] digits = tc.Select(c => c - '0').ToArray();

            int oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
            int evenSum = digits[1] + digits[3] + digits[5] + digits[7];

            int tenthDigit = ((oddSum * 7) - evenSum) % 10;
            if (tenthDigit < 0) tenthDigit += 10;

            if (tenthDigit != digits[9]) return false;

            int sumOfFirstTen = digits.Take(10).Sum();
            int eleventhDigit = sumOfFirstTen % 10;

            if (eleventhDigit != digits[10]) return false;

            return true;
        }

        public static bool IsValidPhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return false;
            phone = phone.Trim();
            
            // Rakam dışındaki karakterleri temizle
            string digits = Regex.Replace(phone, @"\D", "");
            
            // +90 veya 90 ile başlıyorsa kaldır
            if (digits.Length == 12 && digits.StartsWith("90"))
            {
                digits = digits.Substring(2);
            }
            // Başında 0 varsa kaldır
            else if (digits.Length == 11 && digits.StartsWith("0"))
            {
                digits = digits.Substring(1);
            }
            
            // Türkiye için geçerli cep telefonu formatı: 5xx xxx xx xx (10 hane)
            return digits.Length == 10 && digits.StartsWith("5");
        }

        public static bool IsValidEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            email = email.Trim();
            
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
