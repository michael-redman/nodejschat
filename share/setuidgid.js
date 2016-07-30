//Copyright 2016 Michael Redman - IN GOD WE TRVST.

module.exports = function(user,group){
	if	(process.geteuid && !process.geteuid())
		try	{	process.setgid(group);
				process.setuid(user);
			}catch(exception){
				console.error('setuid/setgid failed');
				process.exit(1); } }

//IN GOD WE TRVST.
