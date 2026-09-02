using Xunit;
using MediCore.API.Helpers;

namespace MediCore.Tests
{
    public class VitalEvaluatorTests
    {
        [Fact]
        public void Evaluate_NormalVitals_ReturnsNotKritik()
        {
            // Arrange
            decimal ates = 36.6m;
            int nabiz = 72;
            int tansiyon = 120;
            int spo2 = 98;

            // Act
            var result = VitalEvaluator.Evaluate(ates, nabiz, tansiyon, spo2);

            // Assert
            Assert.False(result.IsKritik);
            Assert.Empty(result.Nedenler);
        }

        [Fact]
        public void Evaluate_HighFever_ReturnsKritikWithFeverReason()
        {
            // Arrange (Ateş > 38.5)
            decimal highFever = 39.2m;

            // Act
            var result = VitalEvaluator.Evaluate(highFever, 75, 120, 98);

            // Assert
            Assert.True(result.IsKritik);
            Assert.Single(result.Nedenler);
            Assert.Contains("Ateş", result.Nedenler[0]);
            Assert.Contains("39", result.Nedenler[0]);
        }

        [Fact]
        public void Evaluate_LowFever_ReturnsKritikWithHypothermiaReason()
        {
            // Arrange (Ateş < 35.0)
            decimal lowFever = 34.5m;

            // Act
            var result = VitalEvaluator.Evaluate(lowFever, 75, 120, 98);

            // Assert
            Assert.True(result.IsKritik);
            Assert.Contains("Hipotermi", result.Nedenler[0]);
        }

        [Theory]
        [InlineData(45, "Bradikardi")] // Nabız < 50
        [InlineData(130, "Taşikardi")] // Nabız > 120
        public void Evaluate_AbnormalPulse_ReturnsKritikWithPulseReason(int nabiz, string expectedCondition)
        {
            // Act
            var result = VitalEvaluator.Evaluate(36.6m, nabiz, 120, 98);

            // Assert
            Assert.True(result.IsKritik);
            Assert.Contains("Nabız", result.Nedenler[0]);
            Assert.Contains(expectedCondition, result.Nedenler[0]);
        }

        [Theory]
        [InlineData(85, "Hipotansiyon")]  // Sistolik Tansiyon < 90
        [InlineData(165, "Hipertansiyon")] // Sistolik Tansiyon > 150
        public void Evaluate_AbnormalBloodPressure_ReturnsKritikWithBPReason(int tansiyon, string expectedCondition)
        {
            // Act
            var result = VitalEvaluator.Evaluate(36.6m, 75, tansiyon, 98);

            // Assert
            Assert.True(result.IsKritik);
            Assert.Contains("Tansiyon", result.Nedenler[0]);
            Assert.Contains(expectedCondition, result.Nedenler[0]);
        }

        [Fact]
        public void Evaluate_LowSpO2_ReturnsKritikWithHypoxiaReason()
        {
            // Arrange (SpO2 < 90)
            int lowSpO2 = 88;

            // Act
            var result = VitalEvaluator.Evaluate(36.6m, 75, 120, lowSpO2);

            // Assert
            Assert.True(result.IsKritik);
            Assert.Contains("SpO2", result.Nedenler[0]);
            Assert.Contains("Hipoksi", result.Nedenler[0]);
        }

        [Fact]
        public void Evaluate_MultipleAbnormalVitals_ReturnsAllReasons()
        {
            // Arrange (Ateş 39.0°C ve Tansiyon 160 mmHg)
            var result = VitalEvaluator.Evaluate(39.0m, 75, 160, 98);

            // Assert
            Assert.True(result.IsKritik);
            Assert.Equal(2, result.Nedenler.Count);
            Assert.Contains(result.Nedenler, r => r.Contains("Ateş"));
            Assert.Contains(result.Nedenler, r => r.Contains("Tansiyon"));
        }
    }
}
