#pragma once

#include "RNOH/Package.h"
#include "generated/RNOH/generated/BaseReactNativeKeychainPackage.h"

namespace rnoh {

class RNKeychainPackage : public BaseReactNativeKeychainPackage {
    using Super = BaseReactNativeKeychainPackage;

public:
    RNKeychainPackage(Package::Context ctx) : Super(ctx) {}
};

} // namespace rnoh
