(function(root,factory){
  const api=factory(root);
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.LibraryLocalBooks=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';

  const books=[{
    id:'local-dont-shoot-the-dog',
    slug:'dont-shoot-the-dog',
    title:"Don't Shoot the Dog! — Karen Pryor",
    created_at:'2026-09-13T00:00:00Z',
    content:{
      category:'Learning · Reinforcement · Behavior',
      summary:"A practical study of reinforcement-based learning: how timing, consequences, conditioned signals, reinforcement schedules and shaping influence behavior. The central idea is to reinforce useful behavior precisely and progressively rather than relying on yelling, vague praise or late punishment.",
      original_text_asset:'content/dont-shoot-the-dog/summaries.json',
      original_text_label:'📝 Our cumulative summaries',
      original_text_subtitle:'Material dictated and summarized in this project · not the full copyrighted text of the book',
      study_updated_at:'2026-09-13',
      ideas:[
        'Reinforcement is defined by its effect: if a consequence increases the future frequency of a behavior, it functioned as a reinforcer.',
        'Timing is information. The learner must be able to connect what is happening now with the consequence that follows.',
        'Yelling is usually less effective than noticing behavior you want and reinforcing it when it occurs.',
        'Reinforcers are relative, not absolute; the same event can be desirable for one learner and aversive for another.',
        'Positive reinforcement adds something the learner wants; negative reinforcement strengthens behavior by allowing an aversive condition to stop or be avoided.',
        'Punishment and negative reinforcement are not the same. Punishment does not reliably teach what the learner should do instead.',
        'Conditioned reinforcers such as a click, word, sound or gesture gain meaning by being paired with a real reinforcer.',
        'A conditioned reinforcer loses power when used meaninglessly; false praise and clicks without consequences dilute the signal.',
        'Variable schedules can make learned behavior extremely persistent because the learner never knows exactly when reinforcement will arrive.',
        'When eliminating a behavior, occasional reinforcement can work against you by strongly maintaining the behavior you are trying to stop.',
        'Accidental reinforcement can create superstitious behavior when the learner falsely connects an unrelated action with a successful result.',
        'Shaping develops complex performance by reinforcing small improvements and raising criteria gradually.',
        'One reinforcement should communicate one criterion clearly; trying to correct several dimensions at once can blur the information.',
        'When a new criterion is introduced, temporarily relax older criteria because previously learned parts may wobble while the learner assimilates the new demand.',
        'Stay ahead of the learner: when a shaping breakthrough happens, the trainer should already know what the next criterion will be.',
        'If a shaping method is not producing learning, change the method rather than remaining loyal to the procedure.',
        'Attention itself can function as reinforcement, and withdrawal of attention can function as punishment, so both should be used deliberately.',
        'If a learned behavior deteriorates, rapidly revisit the original shaping sequence instead of assuming the skill is gone.',
        'Quit while you are ahead: ending after a successful response helps preserve a strong final memory of the session.'
      ],
      topics:[
        'What reinforcement is and how it is defined by results',
        'Positive reinforcement and negative reinforcement',
        'Punishment versus negative reinforcement',
        'Real-time timing of reinforcement',
        'Early reinforcement, delayed reinforcement and bribery',
        'Size of reinforcers and surprise jackpots',
        'Conditioned reinforcers and the click',
        'Keep-going signals and one-click-one-treat',
        'Conditioned aversive signals and an effective No',
        'No-reward markers',
        'Continuous, fixed and variable reinforcement schedules',
        'Delayed gratification and reinforcing the start of long tasks',
        'Superstitious behavior and accidental reinforcement',
        'Group reinforcement and social approval',
        'Healthy and unhealthy self-reinforcement',
        'Shaping: methods versus principles',
        'The Ten Laws of Shaping',
        'Coaching applications: feedback, skill learning, attention and practice design'
      ],
      feed_posts:[
        'Reinforcement has to occur in real time. The consequence tells the learner exactly which behavior mattered.',
        'If a behavior does not increase, either the timing was wrong or what you selected was not actually reinforcing for that individual.',
        'Instead of relying on yelling, watch for behavior you want and reinforce it. This can improve learning and reduce conflict at the same time.',
        'You cannot reinforce a behavior that is not occurring. First find a small version of the desired behavior, then strengthen it.',
        'Positive reinforcement can be used on yourself: notice successful actions, praise them and make success more visible than constant self-criticism.',
        'Reinforcers are relative. Rain may be welcome to a duck and unwelcome to a cat; the learner, not the trainer, determines what is reinforcing.',
        'Negative reinforcement strengthens behavior when a behavior change makes an aversive stimulus stop or allows it to be avoided.',
        'Punishment delivered late may express the trainer’s frustration without giving the learner useful information about what to do next.',
        'A delayed reinforcer can reinforce the wrong thing. Words do not reliably repair poor timing.',
        'An early reinforcer attempts to pay for behavior before it happens; in the book’s framework, that becomes bribery rather than precise reinforcement.',
        'Reinforcers should often be as small as you can get away with. The difficulty of the task can justify a larger reinforcer, and an occasional surprise jackpot can be especially powerful.',
        'A conditioned reinforcer begins as a meaningless signal and gains value by being paired with a real reinforcer.',
        'The click ends the behavior and identifies exactly what earned reinforcement. One click should predict one treat.',
        'Clicks without treats eventually lose their meaning. A conditioned reinforcer must be protected from meaningless use.',
        'A keep-going signal can tell the learner that the current behavior is moving toward eventual reinforcement without ending the behavior.',
        'A conditioned aversive signal such as a properly trained No can give the learner a chance to change behavior before an aversive consequence occurs.',
        'A no-reward marker can communicate that one attempted behavior will not be reinforced, but it works best when the learner already knows how to explore and offer different behaviors.',
        'Beginners need frequent reinforcement. Once a behavior is learned, an unpredictable variable schedule can maintain it very strongly.',
        'Variable reinforcement is one reason gambling is persistent: not knowing when the jackpot will come keeps behavior going.',
        'Variable reinforcement can work against extinction. One cigarette, one drink or one occasional payoff can revive a behavior you are trying to eliminate.',
        'For puzzles and tests, reinforcement also carries information about correctness, so unpredictable reinforcement may be inappropriate.',
        'Long tasks can be maintained by fixed schedules such as a paycheck or a game after weeks of practice, but the delayed reward must still be worth the effort.',
        'When a long task is hard to start, reinforce the act of getting started rather than waiting until the entire task is completed.',
        'Accidental reinforcement can create superstition: if someone chews a pencil during a successful test, they may wrongly conclude that chewing helped cause the success.',
        'Group approval is powerful reinforcement, but a roaring crowd can reinforce agreement even when the group is wrong.',
        'Daily life also needs reinforcement. Healthy examples include walking with friends, conversation and reading; unhealthy immediate reinforcers can include alcohol, smoking and drugs.',
        'Shaping means taking a small tendency in the right direction and moving it one achievable step at a time toward the final performance.',
        'Raise shaping criteria slowly enough that the learner still has a realistic chance to earn reinforcement. If the jump is too large, behavior can break down.',
        'Train one criterion at a time. One reinforcement cannot clearly communicate two different pieces of information.',
        'Before demanding a better response, put the current response on a variable schedule so skipped reinforcement can produce useful variation.',
        'When introducing a new criterion, temporarily relax the old ones. Previously learned behavior may wobble while the new requirement is being integrated.',
        'Stay ahead of the learner. If the learner suddenly jumps from A to B, be ready with C and D so a breakthrough can keep moving.',
        'Do not change trainers in the middle of shaping unless learning has stalled; consistency helps preserve gradually escalating criteria.',
        'If one shaping procedure is not producing progress, try another. Different individuals may need different paths to the same behavior.',
        'Do not interrupt training carelessly. Losing attention at the wrong moment can miss a golden reinforcement opportunity or accidentally punish good behavior.',
        'If a learned skill deteriorates, rapidly review the original shaping steps and reinforce briefly at each level under the new conditions.',
        'Quit while you are ahead. The last successful behavior in a session is likely to be remembered strongly.'
      ]
    }
  }];

  function mergeBooks(remoteBooks){
    const merged=Array.isArray(remoteBooks)?remoteBooks.slice():[];
    for(const local of books){
      const index=merged.findIndex(book=>String(book&&book.id||'')===local.id||String(book&&book.slug||'')===local.slug);
      if(index<0){merged.push(local);continue;}
      const remote=merged[index]||{};
      merged[index]={
        ...remote,
        ...local,
        id:remote.id||local.id,
        created_at:remote.created_at||local.created_at,
        content:{...(remote.content||{}),...(local.content||{})}
      };
    }
    return merged;
  }

  function mergePayload(data){
    const payload=data&&typeof data==='object'?{...data}:{};
    payload.books=mergeBooks(payload.books);
    return payload;
  }

  function isLibraryJsonUrl(input){
    const value=typeof input==='string'?input:(input&&typeof input.url==='string'?input.url:'');
    try{
      const url=new URL(value,'https://local.invalid');
      return /\/functions\/v1\/library-feed$/.test(url.pathname)&&url.searchParams.get('json')==='1';
    }catch(_error){
      return false;
    }
  }

  function installFetchBridge(target){
    if(!target||typeof target.fetch!=='function'||target.__libraryLocalBooksFetchInstalled)return;
    const nativeFetch=target.fetch.bind(target);
    target.__libraryLocalBooksFetchInstalled=true;
    target.fetch=async function(input,init){
      const response=await nativeFetch(input,init);
      if(!isLibraryJsonUrl(input)||!response||!response.ok)return response;
      try{
        const data=await response.clone().json();
        const headers=new Headers(response.headers);
        headers.delete('content-length');
        headers.delete('content-encoding');
        headers.set('content-type','application/json; charset=utf-8');
        return new Response(JSON.stringify(mergePayload(data)),{
          status:response.status,
          statusText:response.statusText,
          headers
        });
      }catch(_error){
        return response;
      }
    };
  }

  if(root&&root.window===root)installFetchBridge(root);
  return {books,mergeBooks,mergePayload,isLibraryJsonUrl,installFetchBridge};
});
