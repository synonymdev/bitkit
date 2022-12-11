#!/usr/bin/env bash

# file paths
PACKAGE_PATH="./package.json"
ANDROID_PATH="./android/app/build.gradle"
IOS_PATH="./ios/bitkit.xcodeproj/project.pbxproj"

# save argument
command=$1

# Get current version from files
current_version=$(npm run env | grep npm_package_version | cut -d '=' -f 2)
current_version_code_android=$(grep -m 1 "versionCode" $ANDROID_PATH | awk '{print $NF}')
current_version_code_ios=$(grep -m 1 "CURRENT_PROJECT_VERSION =" $IOS_PATH | awk '{print $NF}' | sed 's/.$//')

# extract parts (current version)
set -- "$current_version"
oIFS="$IFS" && IFS="-"; declare -a Array=($*) && IFS="$oIFS" && unset oIFS
current_normal=$(echo "${Array[0]}")
current_pre_release=$(echo "${Array[1]}")
current_pre_id=${current_pre_release%%*.} && current_pre_id=${current_pre_id%.*}
current_pre_patch=${current_pre_release##*.}

# argument & defaults
 [[ -n $current_pre_release ]] && default_level="prerelease" || default_level="patch"
level=${command:-$default_level}

# check that level is one of:
array=('major' 'minor' 'patch' 'premajor' 'preminor' 'prepatch' 'prerelease')
if [[ "${array[*]}" =~ (^|[^[:alpha:]])$level([^[:alpha:]]|$) ]]; then
    # get incremented version
    new_version=$(npx semver --increment $level $current_version)
else
    echo "\"$level\" is not a valid level. Level can \
be one of: major, minor, patch, premajor, preminor, \
prepatch, or prerelease. Default level is '$default_level'. \
Only one version may be specified."
fi

# check for inconsistencies
if [[ -n $current_pre_patch ]]; then
    if [[ $current_pre_patch != $current_version_code_android ]]; then
        echo "WARNING: versionCode ($current_version_code_android) does not match prepatch version ($current_pre_patch) in file \"$ANDROID_PATH\""
    fi
    if [[ $current_pre_patch != $current_version_code_ios ]]; then
        echo "WARNING: CURRENT_PROJECT_VERSION ($current_version_code_ios) does not match prepatch version ($current_pre_patch) in file \"$IOS_PATH\""
    fi
fi

# extract parts (new version)
set -- "$new_version"
oIFS="$IFS" && IFS="-"; declare -a Array=($*) && IFS="$oIFS" && unset oIFS
new_normal=$(echo "${Array[0]}")
new_pre_release=$(echo "${Array[1]}")
new_pre_id=${new_pre_release%%*.} && new_pre_id=${new_pre_id%.*}
new_pre_patch=${new_pre_release##*.}

# get version name strings
[[ -n $current_pre_release ]] && current_version_name="$current_normal-$current_pre_id" || current_version_name="$current_normal"
[[ -n $new_pre_release ]] && new_version_name="$new_normal-$new_pre_id" || new_version_name="$new_normal"

# bump package.json version
sed -i '' "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/g" $PACKAGE_PATH

# bump Android (versionCode & versionName)
sed -i '' "s/$current_version_name/$new_version_name/g" $ANDROID_PATH
if [[ -n $new_pre_patch ]]; then
    # use the prepatch version if it extists
    sed -i '' "s/versionCode $current_pre_patch/versionCode $new_pre_patch/g" $ANDROID_PATH
else
    # otherwise just increment what is there
    perl -i -lpe 'BEGIN { sub inc { my ($num) = @_; ++$num } } s/(versionCode )(\d+)/$1 . (inc($2))/eg' $ANDROID_PATH
fi

# bump iOS (CURRENT_PROJECT_VERSION & MARKETING_VERSION)
sed -i '' "s/$current_version_name/$new_version_name/g" $IOS_PATH
if [[ -n $new_pre_patch ]]; then
    # use the prepatch version if it extists
    sed -i '' "s/CURRENT_PROJECT_VERSION = $current_pre_patch/CURRENT_PROJECT_VERSION = $new_pre_patch/g" $IOS_PATH
else
    # otherwise just increment what is there
    perl -i -lpe 'BEGIN { sub inc { my ($num) = @_; ++$num } } s/(CURRENT_PROJECT_VERSION = )(\d+)/$1 . (inc($2))/eg' $IOS_PATH
fi

# Success message
symbol="\xE2\x9C\x94"
green="\e[1;32m"
nc="\e[0m"
checkmark="${green}${symbol}${nc}"
printf "$checkmark Successfully bumped $level version.\n"
echo "$current_version → $new_version"

# Git tag
echo ""
tag="v$new_version"
commit=$(git rev-parse --short HEAD)
read -p "Do you want to tag the current commit with the new version ($tag)? [y/N] " should_tag
echo
if [[ $should_tag =~ [Yy]$ ]]; then
    git tag $tag
    echo "Tagged commit $commit."
fi

