// These paths are particular to tournament administration, and so require a
// logged in user with access to the tournament in question.

// Router controllers
import { sectionRobin } from '../../../controllers/tourn/section/sectionRobin.js';
import { panelCleanJudges, roundJudges } from '../../../controllers/tourn/section/cleanJudges';
import { messageSection, messageRound } from '../../../controllers/tourn/section/blast/message.js';

export default [
	{ path : '/tourn/{tourn_id}/section/robin/{event_id}', module : sectionRobin },
	{ path : '/tourn/{tourn_id}/section/judges/{panel_id}/clean', module : panelCleanJudges },
	{ path : '/tourn/{tourn_id}/round/{round_id}/judges', module : roundJudges },
	{ path : '/tourn/{tourn_id}/round/{round_id}/blast', module : messageRound },
	{ path : '/tourn/{tourn_id}/section/{section_id}/message', module : messageSection },
];
