(function(){
  'use strict';

  function bindTopicLinks(){
    const nav=document.getElementById('coach-topic-nav');
    const data=window.CoachFeedData;
    if(!nav||!data||!Array.isArray(data.COACH_TOPICS)) return;

    nav.addEventListener('click',event=>{
      const control=event.target.closest('[data-coach-topic]');
      if(!control) return;
      const topicId=control.getAttribute('data-coach-topic');
      if(!topicId||topicId==='all') return;
      const topic=data.COACH_TOPICS.find(item=>item.id===topicId);
      if(topic&&topic.page) window.location.href=topic.page;
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bindTopicLinks,{once:true});
  else bindTopicLinks();
})();