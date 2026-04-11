#!/usr/bin/env node
/**
 * 시스템 프록시를 Gridge 프록시로 자동 설정/해제
 *
 * 사용법:
 *   node set-system-proxy.js on    — 프록시 활성화
 *   node set-system-proxy.js off   — 프록시 비활성화
 */

const { execSync } = require("child_process");
const platform = process.platform;
const action = process.argv[2] || "on";
const PORT = 9090;

if (action === "on") {
  console.log(`[Gridge] 시스템 프록시 설정: localhost:${PORT}`);

  if (platform === "darwin") {
    // macOS: networksetup 사용
    try {
      // 활성 네트워크 서비스 찾기
      const services = execSync("networksetup -listallnetworkservices").toString().split("\n")
        .filter(s => s && !s.includes("*") && !s.includes("An asterisk"));

      for (const service of services) {
        const s = service.trim();
        if (!s) continue;
        try {
          execSync(`networksetup -setsecurewebproxy "${s}" localhost ${PORT}`, { stdio: "ignore" });
          execSync(`networksetup -setwebproxy "${s}" localhost ${PORT}`, { stdio: "ignore" });
          console.log(`  ✓ ${s}: 프록시 설정 완료`);
        } catch { /* 비활성 인터페이스 무시 */ }
      }
    } catch (e) {
      console.error("  macOS 프록시 설정 실패:", e.message);
    }

  } else if (platform === "linux") {
    // Linux: 환경변수 + gsettings (GNOME)
    console.log(`  export https_proxy=http://localhost:${PORT}`);
    console.log(`  export http_proxy=http://localhost:${PORT}`);
    try {
      execSync(`gsettings set org.gnome.system.proxy mode 'manual'`, { stdio: "ignore" });
      execSync(`gsettings set org.gnome.system.proxy.https host 'localhost'`, { stdio: "ignore" });
      execSync(`gsettings set org.gnome.system.proxy.https port ${PORT}`, { stdio: "ignore" });
      console.log("  ✓ GNOME 프록시 설정 완료");
    } catch {
      console.log("  ⓘ GNOME이 아닌 환경: 위 환경변수를 수동으로 설정하세요");
    }

  } else if (platform === "win32") {
    // Windows: reg 사용
    try {
      const regPath = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
      execSync(`reg add "${regPath}" /v ProxyEnable /t REG_DWORD /d 1 /f`, { stdio: "ignore" });
      execSync(`reg add "${regPath}" /v ProxyServer /t REG_SZ /d "localhost:${PORT}" /f`, { stdio: "ignore" });
      console.log("  ✓ Windows 프록시 설정 완료");
    } catch (e) {
      console.error("  Windows 프록시 설정 실패:", e.message);
    }
  }

} else if (action === "off") {
  console.log("[Gridge] 시스템 프록시 해제");

  if (platform === "darwin") {
    const services = execSync("networksetup -listallnetworkservices").toString().split("\n")
      .filter(s => s && !s.includes("*") && !s.includes("An asterisk"));
    for (const service of services) {
      const s = service.trim();
      if (!s) continue;
      try {
        execSync(`networksetup -setsecurewebproxystate "${s}" off`, { stdio: "ignore" });
        execSync(`networksetup -setwebproxystate "${s}" off`, { stdio: "ignore" });
      } catch { /* ignore */ }
    }
    console.log("  ✓ macOS 프록시 해제 완료");

  } else if (platform === "linux") {
    try {
      execSync(`gsettings set org.gnome.system.proxy mode 'none'`, { stdio: "ignore" });
    } catch { /* ignore */ }
    console.log("  ✓ 프록시 해제 (환경변수는 수동 제거 필요)");

  } else if (platform === "win32") {
    try {
      const regPath = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings";
      execSync(`reg add "${regPath}" /v ProxyEnable /t REG_DWORD /d 0 /f`, { stdio: "ignore" });
      console.log("  ✓ Windows 프록시 해제 완료");
    } catch { /* ignore */ }
  }
}
