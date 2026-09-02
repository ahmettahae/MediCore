using Xunit;
using MediCore.API.Helpers;

namespace MediCore.Tests
{
    public class ValidationHelperTests
    {
        [Theory]
        [InlineData("10000000078")]
        public void IsValidTcKimlikNo_ValidTc_ReturnsTrue(string validTc)
        {
            // Act
            bool result = ValidationHelper.IsValidTcKimlikNo(validTc);

            // Assert
            Assert.True(result, $"T.C. No {validTc} should be valid according to Luhn algorithm.");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("00000000146")] // Starts with 0
        [InlineData("10000000145")] // Wrong checksum digit
        [InlineData("12345678901")] // Invalid algorithm
        [InlineData("1000000014")]  // 10 digits (too short)
        [InlineData("100000001460")] // 12 digits (too long)
        [InlineData("1000000014A")] // Non-digit character
        public void IsValidTcKimlikNo_InvalidTc_ReturnsFalse(string? invalidTc)
        {
            // Act
            bool result = ValidationHelper.IsValidTcKimlikNo(invalidTc);

            // Assert
            Assert.False(result, $"T.C. No '{invalidTc}' should be invalid.");
        }

        [Theory]
        [InlineData("05551234567")]
        [InlineData("5551234567")]
        [InlineData("+905551234567")]
        public void IsValidPhone_ValidMobileNumber_ReturnsTrue(string phone)
        {
            // Act
            bool result = ValidationHelper.IsValidPhone(phone);

            // Assert
            Assert.True(result, $"Phone number '{phone}' should be valid.");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("02123456789")] // Landline (starts with 2)
        [InlineData("12345")]       // Too short
        public void IsValidPhone_InvalidMobileNumber_ReturnsFalse(string? phone)
        {
            // Act
            bool result = ValidationHelper.IsValidPhone(phone);

            // Assert
            Assert.False(result, $"Phone number '{phone}' should be invalid.");
        }

        [Theory]
        [InlineData("test@example.com")]
        [InlineData("dr.ahmet@medicore.com")]
        public void IsValidEmail_ValidFormat_ReturnsTrue(string email)
        {
            // Act
            bool result = ValidationHelper.IsValidEmail(email);

            // Assert
            Assert.True(result, $"Email '{email}' should be valid.");
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("not-an-email")]
        [InlineData("test@")]
        public void IsValidEmail_InvalidFormat_ReturnsFalse(string? email)
        {
            // Act
            bool result = ValidationHelper.IsValidEmail(email);

            // Assert
            Assert.False(result, $"Email '{email}' should be invalid.");
        }
    }
}
