import { Emitter } from './base';

const _onDidUpdate = new Emitter<void>();
const onDidUpdate = _onDidUpdate.event;

const effect = onDidUpdate(() => console.log('update'));

console.log('start');
_onDidUpdate.fire();
console.log('1');
effect.dispose();
console.log('2');
_onDidUpdate.fire();
console.log('3');
