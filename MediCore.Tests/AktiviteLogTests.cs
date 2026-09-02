using System;
using Xunit;
using MediCore.API.Entities;

namespace MediCore.Tests
{
    public class AktiviteLogTests
    {
        [Fact]
        public void AktiviteLog_Creation_InitializesTarihAutomatically()
        {
            // Act
            var log = new AktiviteLog
            {
                Kullanici = "dr_aterol",
                Rol = "Bashekim",
                IslemTuru = "GIRIS",
                Detay = "Sisteme giriş yaptı."
            };

            // Assert
            Assert.True(log.Tarih <= DateTime.Now, "Log timestamp should be initialized to current time or past.");
            Assert.True(log.Tarih >= DateTime.Now.AddMinutes(-1), "Log timestamp should be recent.");
            Assert.Equal("dr_aterol", log.Kullanici);
            Assert.Equal("Bashekim", log.Rol);
        }
    }
}
