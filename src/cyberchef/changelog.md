# ChangeLog

## v1.1.0
Released 2021-12-28
- Fix for message size when UTF8 chars larger than 1 byte are used in payload.
- All csv fields are now quoted in reply
- json stringify used to build error messages

## v1.0.4
Released 2021-12-27
- Reduced package size (of spl file).
- Changed how CyberChef node api libraries are loaded (correctly this time)
- removed symlink
- updated CyberChef to 9.32.3 (CyberChef node api and Web Gui)
- appinspect validation

## v1.0.3
Released 2021-08-29
- Total re-write of message passing functionality (much simplified, less bugs).
- debug option working, SavedSearch option workign
- Windows not supported now (due to weirdness)
- updated CyberChef to 9.32.2 (CyberChef node api and Web Gui)

## V1.0.2
Released 2021-08-29
- Erroneous release. works....but package size is HUGE.

## v1.0.1
Released 2020-12-05
- Bug and Documentation Fixes
- Make cyberchef custom search command avaliable system wide.
- Documentation updates
- removed unused node modules, added package.json for clarity.
- updated build process to try and pass AppInspect reqiurements

## v1.0.0
Released 2020-11-23
- Initial Release