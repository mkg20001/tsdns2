{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.services.tsdns;
  tsdns = pkgs.tsdns;
in
{
  options = {
    services.tsdns = {
      enable = mkEnableOption "TeamSpeak DNS Server";

      config = mkOption {
        description = "DNS Entries (domain=ip:port)";
        type = types.lines;
      };

      openFirewall = mkOption {
        type = types.bool;
        default = false;
        description = "Open ports in the firewall for TeamSpeak DNS.";
      };
    };
  };

  config = mkIf (cfg.enable) {
    environment.etc."tsdns.ini".text = cfg.config;

    networking.firewall = mkIf cfg.openFirewall {
      allowedTCPPorts = [ 41144 ];
    };

    systemd.services.tsdns = with pkgs; {
      wantedBy = [ "multi-user.target" ];
      after = [ "network.target" ];
      requires = [ "network-online.target" ];

      description = "TeamSpeak DNS";

      serviceConfig = {
        Type = "simple";
        DynamicUser = true;
        ReadWritePaths = "/etc/static/tsdns.ini";
        ExecStart = "${tsdns}/bin/tsdns -c /etc/static/tsdns.ini -h ::";
      };
    };
  };
}

