const {assert,test,compile}=require('./helpers/chatDialogHarness.cjs');
const React=require('react');
test('reward reasons expose selection without changing their colors or callback',()=>{
 const Button=()=>null;
 const Component=compile('src/containers/Chat/Modals/MessageRewardModal/RewardReason.tsx',{
 react:React,'~/components/Icon':()=>null,'~/components/Button':Button,
 '~/constants/defaultValues':{rewardReasons:{1:{color:'green',icon:'star',message:'Helpful'}}}
 }).default;
 let selected;
 for(const selectedReasonId of [0,1]){
 const tree=Component({reasonId:1,selectedReasonId,onSelectReasonId:v=>selected=v,style:{}});
 assert.equal(tree.props['aria-pressed'],selectedReasonId===1);assert.equal(tree.props.color,'green');tree.props.onClick();assert.equal(selected,1);
 }
 assert.equal(Component({reasonId:99,selectedReasonId:0}),null);
});
