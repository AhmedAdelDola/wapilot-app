#!/usr/bin/env bash
# Download a Maven artifact (and its metadata) from Maven Central into a local
# Maven repo, bypassing Gradle's broken JVM TLS stack on this machine (curl works).
set -uo pipefail

REPO="C:/crm/android/localrepo"
BASE="https://repo.maven.apache.org/maven2"

# Usage: dl <group> <artifact> <version> [packaging] [classifier]
dl() {
  local group="$1" artifact="$2" version="$3" packaging="${4:-aar}" classifier="${5:-}"
  local gpath="${group//.//}"
  local file="$artifact-$version"
  [ -n "$classifier" ] && file="$file-$classifier"
  file="$file.$packaging"
  local url="$BASE/$gpath/$artifact/$version/$file"
  local dir="$REPO/$gpath/$artifact/$version"
  mkdir -p "$dir"
  echo "-> $url"
  if curl -fsSL "$url" -o "$dir/$file"; then
    curl -fsSL "$url.sha1" -o "$dir/$file.sha1" 2>/dev/null || true
    curl -fsSL "$url.md5"  -o "$dir/$file.md5"  2>/dev/null || true
    curl -fsSL "$BASE/$gpath/$artifact/$version/$artifact-$version.pom" -o "$dir/$artifact-$version.pom" 2>/dev/null || true
    curl -fsSL "$BASE/$gpath/$artifact/$version/$artifact-$version.module" -o "$dir/$artifact-$version.module" 2>/dev/null || true
    echo "   OK"
  else
    echo "   FAILED $url"
  fi
}

# React Native / Facebook core — note RN publishes AARs with a 'release' classifier
dl com.facebook.react react-android 0.81.5 aar release
dl com.facebook.react hermes-android 0.81.5 aar release
dl com.facebook.soloader soloader 0.13.0 aar
dl com.facebook.soloader soloader 0.10.4 aar
dl com.facebook.fresco fresco 3.2.0 aar
dl com.facebook.fresco imagepipeline 3.2.0 aar
dl com.facebook.fresco imagepipeline-native 3.2.0 aar
dl com.facebook.fresco fbcore 3.2.0 aar
dl com.facebook.fresco drawee 3.2.0 aar
dl com.facebook.fresco drawee-backends 3.2.0 aar
dl com.facebook.fresco memory-type-ashmem 3.2.0 aar
dl com.facebook.yoga yoga 2.1.0 aar
dl com.facebook.yoga flexlayout 2.1.0 aar
dl com.facebook.infer.annotation infer-annotations 0.18.0 jar
dl com.facebook.fbjni fbjni 0.7.0 aar
dl com.facebook.react react-native-toggle 0.81.5 aar release

echo "Done downloading core RN artifacts."
