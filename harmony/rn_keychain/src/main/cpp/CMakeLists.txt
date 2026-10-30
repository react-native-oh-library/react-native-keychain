cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE on)

set(rnoh_keychain_generated_dir "${CMAKE_CURRENT_SOURCE_DIR}/generated")
file(GLOB_RECURSE rnoh_keychain_generated_SRC "${rnoh_keychain_generated_dir}/**/*.cpp")
file(GLOB rnoh_keychain_SRC CONFIGURE_DEPENDS *.cpp)
add_library(rnoh_keychain SHARED ${rnoh_keychain_generated_SRC} ${rnoh_keychain_SRC})
target_include_directories(rnoh_keychain PUBLIC ${CMAKE_CURRENT_SOURCE_DIR} ${rnoh_keychain_generated_dir})
target_link_libraries(rnoh_keychain PUBLIC rnoh)
