document.getElementById('launch-btn').addEventListener('click', () => {
	if (document.getElementById('launch-btn').getAttribute('aria-disabled') === 'true') return;
	document.getElementById('wizard').showModal();
});
   

const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const backBtn = document.getElementById('back-btn');
const nextBtn = document.getElementById('next-btn');
//0 = email, 1 = onedrive, 2 = confirmation, 3 = progress
let current = 0;

function showStep(i) {
	tabs.forEach((tab, n) => {
		const isSelected = (n === i);
		tab.setAttribute('aria-selected', isSelected);
		tab.tabIndex = isSelected ? 0 : -1;
		panels[n].hidden = !isSelected;
	});
current = i;
if (i === 2) buildSummary();
backBtn.setAttribute('aria-disabled', i === 0);
nextBtn.textContent = (i === 2) ? 'Confirm' : 'Next';
}

//clicking a tab
tabs.forEach((tab, n) => {
	tab.addEventListener('click', () => {
		if (tab.getAttribute('aria-disabled') === 'true') return;
		if (n !== current && !validateCurrent()) return;
		showStep(n);
	});
});

//back button
backBtn.addEventListener('click', () => {
	if (backBtn.getAttribute('aria-disabled') === 'true') return;
	showStep(current - 1);
});

//next button
nextBtn.addEventListener('click', () => {
	if (!validateCurrent()) return;
	if (current < 2) {
		showStep(current + 1);
	} else {
		if (!verifyBox.checked) {
			verifyError.textContent = 'Check the box to confirm you understand these changes before continuing.';
			verifyBox.focus();
		return;
		}
		confirmDialog.showModal();
		confirmCancel.focus();
	}
});

//arrow keys
document.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
	if (locked) return;
	if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
	const lastEnabled = 2;
	let next = (e.key === 'ArrowRight') ? current + 1 : current - 1;
	if (next > lastEnabled) next = 0;
	if (next < 0) next = lastEnabled;
	if (!validateCurrent()) return;
	showStep(next);
	tabs[next].focus();
});

//email conflict handling stuff
const emailNone = document.querySelector('[name="email-none"]');
const emailKeep = [...document.querySelectorAll('[name="email-records"], [name="email-specific"], [name="email-group"]')];
const noneReason = document.getElementById('email-none-reason');
const keepReason = document.getElementById('email-keep-reason');

function updateEmailConflicts() {
	const noneChecked = emailNone.checked;
	const anyKeepChecked = emailKeep.some(box => box.checked);

	//if you check any of the 3 top options, disables "not needed"
	emailNone.setAttribute('aria-disabled', anyKeepChecked);
	noneReason.hidden = !anyKeepChecked;

	//if you check "not needed" disables the other 3
	emailKeep.forEach(box => box.setAttribute('aria-disabled', noneChecked));
	keepReason.hidden = !noneChecked;
}

//stops you from clicking on disabled boxes
[emailNone, ...emailKeep].forEach(box => {
	box.addEventListener('click', (e) => {
		if (box.getAttribute('aria-disabled') === 'true') e.preventDefault();
	});
	box.addEventListener('change', updateEmailConflicts);
});

//onedrive conflict handling stuff
const onedriveNone = document.querySelector('[name="onedrive-none"]');
const onedriveKeep = [...document.querySelectorAll('[name="onedrive-records"], [name="onedrive-access"]')];
const onedriveNoneReason = document.getElementById('onedrive-none-reason');
const onedriveKeepReason = document.getElementById('onedrive-keep-reason');

function updateOnedriveConflicts() {
	const noneChecked = onedriveNone.checked;
	const anyKeepChecked = onedriveKeep.some(box => box.checked);

	//if you check either of the top 2 options, disables "no longer needed"
	onedriveNone.setAttribute('aria-disabled', anyKeepChecked);
	onedriveNoneReason.hidden = !anyKeepChecked;

	//if you check "no longer needed" disables the other 2
	onedriveKeep.forEach(box => box.setAttribute('aria-disabled', noneChecked));
	onedriveKeepReason.hidden = !noneChecked;
}

//stops you from clicking on disabled boxes
[onedriveNone, ...onedriveKeep].forEach(box => {
	box.addEventListener('click', (e) => {
		if (box.getAttribute('aria-disabled') === 'true') e.preventDefault();
	});
	box.addEventListener('change', updateOnedriveConflicts);
});


//pickers
//fake people/groups
const directory = {
	user:  ['Joe Martinez', 'Stacy Kim', 'Priya Patel', 'Marcus Lee', 'Dana Brooks'],
	group: ['HR Team', 'Sales', 'IT Support', 'All Staff']
};
//disable at start
const disabledAccounts = ['Marcus Lee'];

function makePickers(list) {
	return list.map(p => ({
		box:      document.querySelector(`[name="${p.box}"]`),
		wrap:     document.getElementById(`${p.box}-picker`),
		input:    document.getElementById(`${p.box}-input`),
		addBtn:   document.getElementById(`${p.box}-add`),
		listEl:   document.getElementById(`${p.box}-selected`),
		error:    document.getElementById(`${p.box}-error`),
		kind:     p.kind,
		msg:      p.msg,
		selected: []
	}));
}

const emailPickers = makePickers([
	{ box: 'email-specific', kind: 'user',  msg: 'Choose at least one user to forward email to, or uncheck this option.' },
	{ box: 'email-group',    kind: 'group', msg: 'Choose a group to forward email to, or uncheck this option.' }
]);
const onedrivePickers = makePickers([
	{ box: 'onedrive-access', kind: 'user', msg: 'Choose at least one user to give OneDrive access to, or uncheck this option.' }
]);
const allPickers = [...emailPickers, ...onedrivePickers];

function clearError(p) {
	p.wrap.classList.remove('has-error');
	p.error.textContent = '';
}

function showError(p, msg) {
	p.wrap.classList.add('has-error');
	p.error.textContent = msg;
}

//show name, check if functional later
async function addSelection(p) {
	const typed = p.input.value.trim();
	if (!typed) return;

	const name = directory[p.kind].find(n => n.toLowerCase() === typed.toLowerCase());
	if (!name) {
		showError(p, `No ${p.kind} named "${typed}". Check the spelling and try again.`);
		return;
	}
	if (p.selected.some(s => s.name === name)) {
		showError(p, `${name} is already added.`);
		return;
	}

	clearError(p);
	p.input.value = '';
	const entry = { name, status: 'checking' };
	p.selected.push(entry);
	entry.el = renderSelected(p, entry);
	announce(`${name} added. Checking account.`);

	//checking here
	await wait(1500);
	if (!p.selected.includes(entry)) return;

	//if account checked is bad, remove
	if (disabledAccounts.includes(name)) {
		removeSelection(p, entry, false);
		showError(p, `${name}'s account is disabled and can't be given access. Choose someone else.`);
	} else {
		entry.status = 'ok';
		entry.el.querySelector('.checking').textContent = '';
	}
}

function renderSelected(p, entry) {
	const li = document.createElement('li');
	li.innerHTML = `<label><input type="checkbox" checked><span></span><span class="checking">Checking account…</span></label>`;
	li.querySelector('span').textContent = entry.name;
	li.querySelector('input').addEventListener('change', () => removeSelection(p, entry, true));
	p.listEl.appendChild(li);
	return li;
}

function removeSelection(p, entry, byAdmin) {
	p.selected = p.selected.filter(s => s !== entry);
	entry.el.remove();
	if (byAdmin) {
		announce(`${entry.name} removed.`);
		p.input.focus();
	}
}

allPickers.forEach(p => {
	//only show while checked
	p.box.addEventListener('change', () => {
		p.wrap.hidden = !p.box.checked;
		if (!p.box.checked) clearError(p);
	});
	p.input.addEventListener('input', () => clearError(p));
	p.input.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			addSelection(p);
		}
	});
	p.addBtn.addEventListener('click', () => addSelection(p));
});

//checks pickers. true if good
function validatePickers(list) {
	let firstBad = null;
	list.forEach(p => {
		if (!p.box.checked) { clearError(p); return; }
		if (p.selected.length === 0) {
			showError(p, p.msg);
		} else if (p.selected.some(s => s.status === 'checking')) {
			showError(p, 'Still checking accounts. Try again in a moment.');
		} else {
			clearError(p);
			return;
		}
		if (!firstBad) firstBad = p.input;
	});
	if (firstBad) firstBad.focus();
	return !firstBad;
}

function validateCurrent() {
	if (current === 0) return validatePickers(emailPickers);
	if (current === 1) return validatePickers(onedrivePickers);
	return true;
}

//closing box when X is clicked
const wizard = document.getElementById('wizard');
const closeBtn = document.getElementById('close-btn');
const discardDialog = document.getElementById('discard-dialog');
const discardNo = document.getElementById('discard-no');
const discardYes = document.getElementById('discard-yes');

//check for any changes
function hasChanges() {
	return [...wizard.querySelectorAll('input')].some(input =>
		input.type === 'checkbox' ? input.checked : input.value.trim() !== ''
	);
}

//resets the wizard
function resetWizard() {
	//uncheck every box
	wizard.querySelectorAll('input[type="checkbox"]').forEach(box => box.checked = false);

	//empty every textbox
	wizard.querySelectorAll('input[type="text"]').forEach(field => field.value = '');

	//reset pickers
	allPickers.forEach(p => {
		p.wrap.hidden = true;
		p.selected = [];
		p.listEl.innerHTML = '';
		clearError(p);
	});

	//clear the verification on confirmation
	verifyError.textContent = '';

	//reset disabled
	updateEmailConflicts();
	updateOnedriveConflicts();

	//start at email
	showStep(0);
}

//close if no changes, otherwise ask
function requestClose() {
	if (locked) { wizard.close(); return; }
	if (!hasChanges()) {
		wizard.close();
		return;
	}
	discardDialog.showModal();
	discardNo.focus();
}

closeBtn.addEventListener('click', requestClose);

//fix escape from closing it always
wizard.addEventListener('cancel', (e) => {
	e.preventDefault();
	requestClose();
});

discardNo.addEventListener('click', () => discardDialog.close());

discardYes.addEventListener('click', () => {
	discardDialog.close();
	resetWizard();
	wizard.close();
});

//focus launch button after close
wizard.addEventListener('close', () => {
	document.getElementById('launch-btn').focus();
});

//confirmation tab
const verifyBox = document.getElementById('verify-box');
const verifyError = document.getElementById('verify-error');
const confirmDialog = document.getElementById('confirm-dialog');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmYes = document.getElementById('confirm-yes');
let locked = false;

function buildSummary() {
	const list = document.getElementById('summary-list');
	list.innerHTML = '';
	const add = (text) => {
		const li = document.createElement('li');
		//textContent here so no weird injection stuff
		li.textContent = text;
		list.appendChild(li);
	};
	const checked = (name) => document.querySelector(`[name="${name}"]`).checked;
	const names = (name) => allPickers.find(p => p.box.name === name).selected.map(s => s.name).join(', ');
	//important to add validation since this currently sucks in live version
	add('Example User will be signed out and blocked from signing in.');

	//check all boxes and add to confirmation tab if checked
	if (checked('email-records') || checked('email-specific') || checked('email-group'))
		add('Their mailbox will be converted to a shared mailbox so email is kept.');
	if (checked('email-records'))
		add('Their email will be exported as a .PST file. Store it somewhere safe.');
	if (checked('email-specific'))
		add(`Their email will be forwarded to: ${names('email-specific')}`);
	if (checked('email-group'))
		add(`Their email will be forwarded to the group: ${names('email-group')}`);
	if (checked('email-none'))
		add('Their email will not be kept. It will be permanently deleted after 30 days.');
	if (checked('onedrive-records'))
		add('Their OneDrive will be downloaded as a .ZIP file.');
	if (checked('onedrive-access'))
		add(`${names('onedrive-access')} will be given access to their OneDrive.`);
	if (checked('onedrive-none'))
		add('Their OneDrive will not be kept. It will be permanently deleted after 30 days.');
}

verifyBox.addEventListener('change', () => {
	if (verifyBox.checked) verifyError.textContent = '';
});

confirmCancel.addEventListener('click', () => confirmDialog.close());

confirmYes.addEventListener('click', () => {
	confirmDialog.close();
	startProgress();
});

//locks the wizard and moves to the progress tab, don't want admins changing things at this point
function startProgress() {
	locked = true;
	tabs.forEach((tab, n) => tab.setAttribute('aria-disabled', n !== 3));
	document.querySelector('footer').hidden = true;
	showStep(3);
	tabs[3].focus();
	runAll();
}

//progress tab
const taskList = document.getElementById('task-list');
const progressEta = document.getElementById('progress-eta');
const progressSummary = document.getElementById('progress-summary');
const progressLive = document.getElementById('progress-live');
const doneBtn = document.getElementById('done-btn');
const statusText = { pending: 'Waiting', running: 'In progress', done: 'Done', failed: 'Failed' };
let tasks = [];

//pause to simulate loading
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//add message
function announce(msg) {
	const p = document.createElement('p');
	p.textContent = msg;
	progressLive.appendChild(p);
}

//build from selected items
function buildTasks() {
	const names = (name) => allPickers.find(p => p.box.name === name).selected.map(s => s.name).join(', ');
	const checked = (name) => document.querySelector(`[name="${name}"]`).checked;
	const t = [];
	t.push({ name: 'Block sign-in', desc: 'Signs Example User out of all devices and blocks new sign-ins.', time: 2000 });
	if (checked('email-records') || checked('email-specific') || checked('email-group'))
		t.push({ name: 'Convert mailbox to shared mailbox', desc: 'Keeps the email without needing a license.', time: 4000 });
	if (checked('email-records'))
		t.push({ name: 'Export email to .PST', desc: 'Your download starts when this finishes.', time: 4000 });
	if (checked('email-specific') || checked('email-group')) {
		const targets = [];
		if (checked('email-specific')) targets.push(names('email-specific'));
		if (checked('email-group')) targets.push(names('email-group'));
		t.push({ name: 'Set up email forwarding', desc: `New email will be forwarded to: ${targets.join(', ')}`, time: 2000 });
	}
	if (checked('onedrive-records'))
		t.push({ name: 'Package OneDrive as .ZIP', desc: 'Your download starts when this finishes.', time: 4000 });
	if (checked('onedrive-access'))
		t.push({ name: 'Grant OneDrive access', desc: `${names('onedrive-access')} will be able to open this OneDrive.`, time: 3000 });
	t.push({ name: 'Remove licenses', desc: 'Office 365 E3 and Visio Plan 2.', time: 3000,
	         failOnce: true, failMsg: "Couldn't reach the licensing service. Nothing was removed. Try again." });
	return t;
}

function renderTask(task) {
	const li = document.createElement('li');
	li.className = 'task';
	li.innerHTML = `
		<span class="task-icon" aria-hidden="true"></span>
		<div class="task-text">
			<strong></strong><span class="task-status"></span>
			<p class="task-desc"></p>
		</div>`;
	li.querySelector('strong').textContent = task.name;
	li.querySelector('.task-desc').textContent = task.desc;
	task.el = li;
	setStatus(task, 'pending');
	taskList.appendChild(li);
}

function setStatus(task, status) {
	task.status = status;
	task.el.dataset.status = status;
	task.el.querySelector('.task-status').textContent = statusText[status];
}

function updateEta() {
	const ms = tasks.filter(t => t.status === 'pending' || t.status === 'running')
	                .reduce((sum, t) => sum + t.time, 0);
	progressEta.textContent = ms ? `Estimated time remaining: about ${Math.ceil(ms / 1000)} seconds` : '';
}

async function runTask(task) {
	setStatus(task, 'running');
	updateEta();
	announce(`${task.name}: in progress.`);
	await wait(task.time);
	if (task.failOnce) {
		task.failOnce = false;	//fails the first time to simulate
		setStatus(task, 'failed');
		addRetry(task);
		announce(`${task.name} failed. ${task.failMsg}`);
	} else {
		setStatus(task, 'done');
		announce(`${task.name}: done.`);
	}
	updateEta();
}

//when task fails
function addRetry(task) {
	const msg = document.createElement('p');
	msg.className = 'error';
	msg.textContent = task.failMsg;
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'retry-btn';
	btn.textContent = 'Retry';
	btn.setAttribute('aria-label', `Retry ${task.name}`);
	btn.addEventListener('click', async () => {
		msg.remove();
		btn.remove();
		await runTask(task);
		finishIfDone();
	});
	task.el.querySelector('.task-text').append(msg, btn);
	btn.focus();
}

async function runAll() {
	tasks = buildTasks();
	taskList.innerHTML = '';
	tasks.forEach(renderTask);
	announce(`Offboarding started. ${tasks.length} tasks.`);
	for (const task of tasks) await runTask(task);
	finishIfDone();
}

function finishIfDone() {
	if (tasks.some(t => t.status === 'pending' || t.status === 'running')) return;
	const failed = tasks.filter(t => t.status === 'failed');
	progressSummary.hidden = false;
	if (failed.length) {
		progressSummary.classList.add('has-error');
		progressSummary.textContent = `${failed.length} task failed. Everything else finished. Use Retry to try it again.`;
	} else {
		progressSummary.classList.remove('has-error');
		progressSummary.textContent = 'All done. Example User has been offboarded.';
		doneBtn.hidden = false;
		doneBtn.focus();
		disableLaunch();
	}
	announce(progressSummary.textContent);
}

//disable launch after user disabled
function disableLaunch() {
	document.getElementById('launch-btn').setAttribute('aria-disabled', 'true');
	const reason = document.getElementById('launch-reason');
	reason.textContent = `Example User was offboarded on ${new Date().toLocaleDateString()}.`;
	reason.hidden = false;
}

doneBtn.addEventListener('click', () => wizard.close());

document.getElementById('offboard-form').addEventListener('submit', (e) => e.preventDefault());
showStep(0);
updateEmailConflicts();
updateOnedriveConflicts();