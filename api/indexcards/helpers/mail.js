import nodemailer from 'nodemailer';
import { convert } from 'html-to-text';
import config from '../../config/config';
import { errorLogger } from './logger';

export const emailBlast = async (inputData) => {

	const messageData = { ...inputData };

	const transporter = nodemailer.createTransport({
		host   : config.MAIL_SERVER,
		port   : config.MAIL_PORT,
		secure : false,
	});

	if (!messageData.text && !messageData.html) {
		return { error: true, count: 0, message: 'No message body; not sending' };
	}

	if (messageData.html && !messageData.text) {
		messageData.text = convert(messageData.html);
	}

	if (!messageData.email) {
		return { error: true, count: 0, message: 'No desination addresses provided, not sent' };
	}

	// Only send BCC emails so folks do not reply all or see student contact
	// etc. And then add the sender as the To as well so it will not deliver.

	messageData.bcc = Array.from(new Set(messageData.email));
	messageData.to = messageData.to ? messageData.to : config.MAIL_FROM;
	messageData.from = messageData.from ? messageData.from : config.MAIL_FROM;

	if (!messageData.subject) {
		messageData.subject = 'Message from Tab';
	}

	if (messageData.text) {
		if (messageData.append) {
			messageData.text += `\n\n${convert(messageData.append)}\n`;
		}
		messageData.text += '\n----------------------------\n';
		messageData.text +=  'You received this email because you registered for an account on https://www.tabroom.com\n';
		messageData.text += 'To stop them, login to your Tabroom account, click the Profile icon at top right, and ';
		messageData.text += 'check off "No Emails", then save your profile. ';
		messageData.text += 'You can also delete your Tabroom account entirely on that profile screen.';
	}

	if (messageData.html) {
		if (messageData.append) {
			messageData.html += `<br /><p>${convert(messageData.append)}</p>`;
		}
		messageData.html += '<p>-----------------------------</p>';
		messageData.html += '<p>You received this email because you registered for an account on ';
		messageData.html += '<a href="https://www.tabroom.com">https://www.tabroom.com</a></p>';
		messageData.html += '<p>To stop them, visit ';
		messageData.html += '<a href="https://www.tabroom.com/user/login/profile.mhtml">Your Profile</a>, ';
		messageData.html += 'check off "No Emails", and save.';
		messageData.html += 'You can also delete your Tabroom account entirely on your profile.</p>';
	}

	let info = {};

	if (process.env.NODE_ENV === 'production') {
		info = await transporter.sendMail(messageData);
	} else {
		errorLogger.info(`Local: email not sending from ${messageData.from} to ${messageData.to} bcc ${messageData.bcc}`);
		errorLogger.info(`Subject ${messageData.subject}`);
		errorLogger.info(`Text ${messageData.text}`);
		errorLogger.info(`HTML ${messageData.html}`);
	}

	return {
		error   : false,
		count   : messageData.bcc?.length,
		message : `Email message sent to ${(messageData.bcc ? messageData.bcc.length : 0)} recipients`,
		info,
	};
};

export const phoneBlast = async (inputData) => {

	const messageData = { ...inputData };

	const transporter = nodemailer.createTransport({
		host   : config.MAIL_SERVER,
		port   : config.MAIL_PORT,
		secure : false,
	});

	if (!messageData.text && !messageData.html) {
		return { error: true, count: 0, message: 'No message body; not sending' };
	}

	if (!messageData.phone) {
		return { error: true, count: 0, message: 'No desination addresses provided, not sent' };
	}

	if (messageData.html && !messageData.text) {
		messageData.text = convert(messageData.html);
	}

	if (messageData.text) {
		messageData.text.replace(/(?:\r\n|\r|\n)/g, '<br>');
	}
	delete messageData.html;

	// Only send BCC emails so folks do not reply all or see student contact
	// etc. And then add the sender as the To as well so it will not deliver.

	messageData.bcc = Array.from(new Set(messageData.phone));
	messageData.to = messageData.to ? messageData.to : config.MAIL_FROM;
	messageData.from = messageData.from ? messageData.from : config.MAIL_FROM;

	if (messageData.append) {
		messageData.text += `\n${convert(messageData.append)}`;
	}
	messageData.text += '\n\n';
	messageData.text += 'You registered for these texts on Tabroom.com\n';
	messageData.text += 'To stop texts, log into Tabroom, click the Profile icon at top, select No Emails.';

	let info = {};

	if (process.env.NODE_ENV === 'production') {
		info = await transporter.sendMail(messageData);
	} else {
		errorLogger.info(`Local: not sending sms blast for ${messageData.from} to ${messageData.to} bcc ${messageData.bcc}`);
		errorLogger.info(`Subject ${messageData.subject}`);
		errorLogger.info(`Text ${messageData.text}`);
	}

	return {
		error   : false,
		count   : messageData.bcc?.length,
		message : `Phone blasts sent to ${(messageData.bcc ? messageData.bcc.length : 0)} recipients`,
		info,
	};

};

export const adminBlast = async (inputData) => {

	const messageData = { ...inputData };

	const transporter = nodemailer.createTransport({
		host   : config.ADMIN_MAIL_SERVER ? config.ADMIN_MAIL_SERVER : config.MAIL_SERVER,
		port   : config.ADMIN_MAIL_PORT ? config.ADMIN_MAIL_PORT : config.MAIL_PORT,
		secure : false,
	});

	if (!messageData.text && !messageData.html) {
		return { error: true, count: 0, message: 'No message body; not sending' };
	}

	if (messageData.html && !messageData.text) {
		messageData.text = convert(messageData.html);
	}

	if (!messageData.email && !messageData.phone) {
		return { error: true, count: 0, message: 'No desination addresses provided, not sent' };
	}

	if (!messageData.subject) {
		messageData.subject = 'Admin Blast';
	}

	if (messageData.text) {
		if (messageData.append) {
			messageData.text += `\n\n${convert(messageData.append)}\n`;
		}
		messageData.text += '\n----------------------------\n';
		messageData.text += 'Admin blast from https://www.tabroom.com\n';
		messageData.text += 'To stop them, click No Emails from your profile on Tabroom.\n';
	}

	if (messageData.html) {
		if (messageData.append) {
			messageData.html += `<br /><p>${convert(messageData.append)}</p>`;
		}
		messageData.html += '<p>-----------------------------</p>';
		messageData.html += '<p>Admin blast from Tabroom.  To stop them, visit ';
		messageData.html += '<a href="https://www.tabroom.com/user/login/profile.mhtml">Your Profile</a>, ';
		messageData.html += 'check off "No Emails", and save</p>';
	}

	let info = {};
	messageData.from = messageData.from ? messageData.from : config.MAIL_FROM;

	if (messageData.email) {
		messageData.to = messageData.email;
		if (process.env.NODE_ENV === 'production') {
			info = await transporter.sendMail(messageData);
		} else {
			errorLogger.info(`Local: Admin email not sending from ${messageData.from} to ${messageData.to}`);
			errorLogger.info(`Subject ${messageData.subject}`);
			errorLogger.info(`Text ${messageData.text}`);
			errorLogger.info(`HTML ${messageData.html}`);
		}
	}

	if (messageData.phone) {
		messageData.to = messageData.phone;
		if (process.env.NODE_ENV === 'production') {
			info = await transporter.sendMail(messageData);
		} else {
			errorLogger.info(`Local: Admin SMS not sending from ${messageData.from} to ${messageData.to}`);
			errorLogger.info(`Subject ${messageData.subject}`);
			errorLogger.info(`Text ${messageData.text}`);
			errorLogger.info(`HTML ${messageData.html}`);
		}
	}

	return {
		error   : false,
		count   : messageData.to?.length,
		message : `Administration blast message sent`,
		info,
	};
};
export default emailBlast;
