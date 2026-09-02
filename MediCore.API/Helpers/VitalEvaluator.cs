namespace MediCore.API.Helpers
{
    public class VitalEvaluationResult
    {
        public bool IsKritik { get; set; }
        public List<string> Nedenler { get; set; } = new();
    }

    public static class VitalEvaluator
    {
        public static VitalEvaluationResult Evaluate(decimal? atesC, int? nabizBPM, int? tansiyonSistol, int? saturasyonYuzdesi)
        {
            var result = new VitalEvaluationResult();

            if (atesC.HasValue && (atesC.Value < 35.0m || atesC.Value > 38.5m))
            {
                result.IsKritik = true;
                string durum = atesC.Value < 35.0m ? "Hipotermi (Düşük)" : "Yüksek Ateş";
                result.Nedenler.Add($"Ateş: {atesC.Value}°C ({durum})");
            }

            if (nabizBPM.HasValue && (nabizBPM.Value < 50 || nabizBPM.Value > 120))
            {
                result.IsKritik = true;
                string durum = nabizBPM.Value < 50 ? "Bradikardi (Düşük)" : "Taşikardi (Yüksek)";
                result.Nedenler.Add($"Nabız: {nabizBPM.Value} BPM ({durum})");
            }

            if (tansiyonSistol.HasValue && (tansiyonSistol.Value < 90 || tansiyonSistol.Value > 150))
            {
                result.IsKritik = true;
                string durum = tansiyonSistol.Value < 90 ? "Hipotansiyon (Düşük)" : "Hipertansiyon (Yüksek)";
                result.Nedenler.Add($"Tansiyon: {tansiyonSistol.Value} mmHg ({durum})");
            }

            if (saturasyonYuzdesi.HasValue && saturasyonYuzdesi.Value < 90)
            {
                result.IsKritik = true;
                result.Nedenler.Add($"SpO2: %{saturasyonYuzdesi.Value} (Hipoksi)");
            }

            return result;
        }
    }
}
