{ stdenv
, lib
, drvSrc ? ./.
, mkNode
, nodejs-14_x
, makeWrapper
}:

mkNode {
  root = drvSrc;
  nodejs = nodejs-14_x;
  production = true;
  packageLock = ./package-lock.json;
} {}

