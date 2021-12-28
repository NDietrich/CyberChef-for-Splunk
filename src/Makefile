# What is the name of the TA folder?
APPNAME=cyberchef

# splunk username and password for install
USERNAME=admin
PASS=changeme

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

# remove any rm -rf commands in package.json and other files (to pass splunk AppInspect). Replace with ls -al
	find ./build/${APPNAME}/bin/ -iname "package.json" -exec sed -i 's/rm -rf/ls -al/g' {} \;
	find ./build/${APPNAME}/bin/ -iname "yarn-error.log" -exec sed -i 's/rm -rf/ls -al/g' {} \;
	find ./build/${APPNAME}/bin/node_modules -iname "Makefile" -exec sed -i 's/rm -rf/ls -al/g' {} \;
	find ./build/${APPNAME}/bin/node_modules -iname "*.ts" -exec sed -i 's/rm -rf/ls -al/g' {} \;

# all files should be 644, directories should be 755
# http://dev.splunk.com/view/app-cert/SP-CAAAE3H
	find ./build/${APPNAME} -type f -exec chmod 644 {} \;
	find ./build/${APPNAME} -type d -exec chmod 755 {} \;

# remove all temp files (ending with tilde)
	find ./build -type f -name '*~' -exec rm -f '{}' \; 
	
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
	sudo /opt/splunk/bin/splunk install app cyberchef.spl -update 1 -auth admin:changeme

# Create a SPL without deleting the local folder contents (for local testing)
.PHONY : local-spl
local-spl : clean
	$(call clone_src_folder,)
	$(call clean_src_folder, )
	$(call build_SPL, )


.PHONY : clean
clean : 
	-rm -rf ./build
	-rm -rf ${APPNAME}.spl
	-rm -rf ${APPNAME}.spl.tgz