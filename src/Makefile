# What is the name of the TA folder?
APPNAME=cyberchef

# where to instll the SPL file (extracted to your snort app directory)
# may need to run with elevated priviledges to install to Splunk directory
APPDIR=/home/noah/Desktop/

# Function Definitions 

# create a clone of the source folder into the build folder
define clone_src_folder
# create temp working folder
	mkdir build
	cp -r ./${APPNAME} ./build
	chmod 755 ./build/${APPNAME}
endef

# Prepare a source folder to be turned into a spl file, do NOT remove the local directory
define clean_src_folder
# remove all hidden files and folders
# ignore errors from this command (they aren't real...there is no spoon)
	 find ./build/${APPNAME}/ -mindepth 1 -name '.*' -exec rm -rf "{}" \;  || true
	 
# remove local.meta file
	rm -rf ./build/${APPNAME}/metadata/local.meta || true

# remove any rm -rf commands in package.json (to pass splunk AppInspect). Replace with ls -al
	find ./build/${APPNAME}/bin/node_modules -name "package.json" -exec sed -i 's/rm -rf/ls -al/' {} \;

# get rid of all readme.md files (not needed); rename tesseract's README.md since it has compilation instructions for the WASM file (required by appinspect)
	mv ./build/${APPNAME}/bin/node_modules/tesseract.js-core/readme.md ./build/${APPNAME}/bin/node_modules/tesseract.js-core/readme.md.txt
	find ./build/${APPNAME}/bin/node_modules -iname "readme.md" -delete

# all files should be 644, directories should be 755
# http://dev.splunk.com/view/app-cert/SP-CAAAE3H
	find ./build/${APPNAME} -type f -exec chmod 644 {} \;
	find ./build/${APPNAME} -type d -exec chmod 755 {} \;

# get rid of all .pyc files in bin (todo, not working)
#find ./bin -type f -name '*.pyc' -delete 2>/dev/null

# remove all temp files (ending with tilde)
	find ./build -type f -name '*~' -exec rm -f '{}' \; 
	
# Remove swf file (so the app will pass appinspect)
	rm ./build/${APPNAME}/bin/node_modules/node-forge/flash/swf/SocketPool.swf 
endef

# Build SPL file
define build_SPL
# create spl file (tar.gz)
	cd ./build ; tar -zcf ${APPNAME}.tar.gz ${APPNAME}
	mv ./build/${APPNAME}.tar.gz ${APPNAME}.spl

endef

# Default Command
spl : clean
	$(call clone_src_folder,)
	$(call clean_src_folder, )
	rm -rf ./build/${APPNAME}/local/
	$(call build_SPL, )

.PHONY : install
install : spl
	rm -rf ${APPDIR}
	tar -xzvf ${APPNAME}.spl --directory ${APPDIR}

# Create a SPL without deleting the local folder contents (for local testing)
.PHONY : local-spl
local-spl : clean
	$(call clone_src_folder,)
	$(call clean_src_folder, )
	$(call build_SPL, )

.PHONY : local-install
install-testing : local-spl
	rm -rf ${APPDIR}/${APPNAME}
	tar -xzvf ${APPNAME}.spl --directory ${APPDIR}


.PHONY : clean
clean : 
	-rm -rf ./build
	-rm -rf ${APPNAME}.spl
	-rm -rf ${APPNAME}.spl.tgz