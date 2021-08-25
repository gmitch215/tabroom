import { access } from "fs";

export const changeAccess = {

	// A POST creates a new tournament permission for the user
    POST: async (req, res) => {
		const db = req.db;
		const adminId = req.params.target_id;
		const tournId = req.params.tourn_id;
		let accessLevel = "checker";

		if (req.params.other_value) { 
			accessLevel = req.params.other_value;
		};

		if (
			accessLevel === "checker"
			|| accessLevel === "tabber"
			|| accessLevel === "by_event"
			|| (accessLevel === "owner" && req.session[tournId].level === "owner")
		) { 
			// everything is a-ok
		} else {
			return res.status(200).json({ 
				error: true,
				message: `Invalid access level requested: ${accessLevel}`
			});
		}

		let already = await db.permission.findAll({
			where : { tourn: tournId, person: adminId}
		});

		parsePerms(already).then(async function(existing) { 

			if (existing.level) { 
				return res.status(200).json({ 
					error: true,
					message: 'User already has access'
				});

			} else { 

				let newAdmin = await db.person.findByPk(personId);
				
				const newPerm =  db.permission.build({
					person : newAdmin,
					tag    : accessLevel
				});

				try {
					await newPerm.save();
				} catch(error) {
					console.log(error);
				}

				const changeLog = db.changeLog.build({
					tag         : "access",
					tourn       : tournId,
					person      : req.session.person,
					description : `Added ${newAdmin.email} with ${accessLevel} level permissions`,
					created_at  : Date()
				});

				try {
					await changeLog.save();
				} catch(error) {
					console.log(error);
				}

				return res.status(200).json({ 
					error: false,
					message: `User ${newAdmin.email} has been given ${accessLevel} access`
				});
			}
		});
		return;
    },

	// A PUT alters an existing permission level or contact status
	PUT: async (req, res) => { 

		const db = req.db;
		const adminId = req.body.target_id;
		const tournId = req.params.tourn_id;
		let accessLevel = req.body.property_value;
		let contactStatus = false;

		if (req.body.property_name === "contact") { 
			accessLevel = "contact";
			contactStatus = true;
		}

		if (
			accessLevel === "checker"
			|| accessLevel === "tabber"
			|| accessLevel === "by_event"
			|| (accessLevel === "owner" && req.session[tournId].level === "owner")
		) { 

			let already = await db.permission.findAll({
				where : { tourn: tournId, person: adminId},
				include : [
					{ model: db.person, as: 'Person' },
				]
			});

			var existing = await parsePerms(already);

			if	(accessLevel === "contact") {
				
				if (contactStatus) { 

					return res.status(200).json({
						error: false,
						message: 'Contact status kept'
					 });

					// I am a contact.  I have a contact.  All is well
					
				} else if (existing.contactObject) { 
					
					await existing.contactObject.destroy();
					
					const changeLog = db.changeLog.build({
						tag         : "access",
						tourn       : tournId,
						person      : req.session.person,
						description : `Removed ${existing.person.email} as a contact`,
						created_at  : Date()
					});

					return res.status(200).json({
						error: false,
						message: 'Contact status removed'
					 });

				} else {
					
					return res.status(200).json({
						error: false,
						message: 'Contact status removed'
					 });
				}

			} else { 

				existing.permObject.tag = accessLevel;

				try {
					await existing.permObject.save();
				} catch(error) {
					console.log(error);
				}
				
				const changeLog = db.changeLog.build({
					tag         : "access",
					tourn       : tournId,
					person      : req.session.person,
					created_at  : Date(),
					description : `Changed ${existing.person.email} access level to ${accessLevel}`
				});

				try {
					await changeLog.save();
				} catch(error) {
					console.log(error);
				}

				return res.status(200).json({
					error: false,
					message: `Permissions level changed for ${existing.person.email}`
				 });
			}

		} else {
			return res.status(200).json({ 
				error: true,
				message: `Invalid access level requested: ${accessLevel}`
			});
		}
	},

	// A DELETE removes access from the user
	DELETE: async (req, res) => { 

		const db = req.db;
		const adminId = req.body.target_id;
		const tournId = req.params.tourn_id;

		let already = await db.permission.findAll({
			where : { tourn: tournId, person: adminId},
			include : [
				{ model: db.person, as: 'Person' },
			]
		});

		let existing = await parsePerms(already)

		if (existing.person === undefined) {
			return res.status(200).json({ 
				error: true,
				message: 'That account has already lost access to this tournament.  You may want to refresh the page.'
			});
		}

		const reply = { 
			error: false,
			message: `${existing.person.first} ${existing.person.last}'s access to this tournament has been revoked.`,
			destroy: existing.person.id
		};

		const checkOwner = async (target) => {
			if (target.level === "owner") { 
				if (req.session[tournId].level != "owner") { 
					return res.status(200).json({ 
						error: true,
						message: 'Only a tournament owner may revoke privileges from another'
					});
				}
			}
			return;
		};

		const destroyPerms = async (target) => {
			if (target.contactObject) { 
				await target.contactObject.destroy();
			}
					
			if (target.permObject) { 
				await target.permObject.destroy();
			}
			return;
		}

		await checkOwner(existing);
		await destroyPerms(existing);
		
		const changeLog = db.changeLog.build({
			tag         : "access",
			Tourn       : tournId,
			person      : req.session.person,
			created_at  : Date(),
			description : reply.message
		});
			
		try {
			await changeLog.save();
		} catch(error) {
			console.log(error);
		}

		return res.status(200).json(reply);
	},
};

changeAccess.POST.apiDoc = {
    summary     : 'Change, delete and add tournament permissions for user accounts',
    operationId : 'listSchools',
    parameters: [
        {
            in          : 'parameters',
            name        : 'target_id',
            description : 'Person ID',
            required    : true,
            schema      : {
				type    : 'integer',
				minimum : 1
			},
        },
        {
            in          : 'parameters',
            name        : 'property_name',
            description : 'Access Level',
            required    : false,
            schema      : {
				type    : 'string',
				enum    : ['owner','tabber','checker','by_event']
			},
        },
    ],
    responses: {
        200: {
            description: 'Success! Messages included',
        },
        default: { $ref: '#/components/responses/ErrorResponse' },
    },
    tags: ['tournament/setup'],
};
		
const parsePerms = async (permsArray) => {

	let permsOutput = {};

	for (let perm of permsArray) { 

		if (permsOutput.person === undefined) { 
			permsOutput.person = perm.Person;
		}

		if (perm.tag === "contact") { 
			permsOutput.contact = true;
			permsOutput.contactObject = perm;
		} else if (permsOutput.level) { 
			// duplicates are the bane of all
			await perm.destroy();
		} else { 
			permsOutput.level = perm.tag;
			permsOutput.permObject = perm;
		}
	}

	return permsOutput;
}