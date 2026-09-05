// The hero photo, picked by season at BUILD time — the site is static, so the
// season only turns when the deploy workflow reruns (it has a monthly cron).
// All four still point at the one photo we have; swap a path as each shot lands.
import spring from './images/st-vlad.jpg';
import summer from './images/st-vlad.jpg';
import fall   from './images/st-vlad.jpg';
import winter from './images/st-vlad.jpg';

// Dec-Feb winter, Mar-May spring, Jun-Aug summer, Sep-Nov fall. Month buckets,
// not equinoxes — nobody in the parish will notice the three-week difference.
export default [winter, winter, spring, spring, spring, summer, summer, summer, fall, fall, fall, winter][new Date().getMonth()];
