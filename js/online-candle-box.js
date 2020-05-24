
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function (exports) {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next, lookup.has(block.key));
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/CandleBox.svelte generated by Svelte v3.22.3 */

    const { console: console_1 } = globals;
    const file = "src/CandleBox.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    // (198:2) {#each getCandles(loc, order) as candle (candle.key)}
    function create_each_block_2(key_1, ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_transition;
    	let current;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = /*candle*/ ctx[37].image)) attr_dev(img, "src", img_src_value);
    			set_style(img, "transform", "rotate(" + /*candle*/ ctx[37].rotate + "deg)");
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-fnj9rc");
    			add_location(img, file, 199, 4, 4354);
    			attr_dev(div, "class", "candle svelte-fnj9rc");
    			set_style(div, "left", /*candle*/ ctx[37].pos + "%");
    			set_style(div, "height", /*candle*/ ctx[37].height);
    			add_location(div, file, 198, 3, 4236);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*locations, order*/ 34 && img.src !== (img_src_value = /*candle*/ ctx[37].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty[0] & /*locations, order*/ 34) {
    				set_style(img, "transform", "rotate(" + /*candle*/ ctx[37].rotate + "deg)");
    			}

    			if (!current || dirty[0] & /*locations, order*/ 34) {
    				set_style(div, "left", /*candle*/ ctx[37].pos + "%");
    			}

    			if (!current || dirty[0] & /*locations, order*/ 34) {
    				set_style(div, "height", /*candle*/ ctx[37].height);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 100, duration: 500 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: 100, duration: 500 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(198:2) {#each getCandles(loc, order) as candle (candle.key)}",
    		ctx
    	});

    	return block;
    }

    // (207:2) {#each products as prod}
    function create_each_block_1(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let button0;
    	let t1;
    	let span;
    	let t2_value = /*prod*/ ctx[34].description[/*lang*/ ctx[0]] + "";
    	let t2;
    	let t3;
    	let t4_value = /*prod*/ ctx[34].price.toFixed(2) + "";
    	let t4;
    	let t5;
    	let t6_value = /*getQuantity*/ ctx[9](/*loc*/ ctx[31], /*prod*/ ctx[34], /*order*/ ctx[5]) + "";
    	let t6;
    	let t7;
    	let button1;
    	let t9;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[28](/*loc*/ ctx[31], /*prod*/ ctx[34], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[29](/*loc*/ ctx[31], /*prod*/ ctx[34], ...args);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "-";
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = text(": $");
    			t4 = text(t4_value);
    			t5 = text(" ×");
    			t6 = text(t6_value);
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			t9 = space();
    			attr_dev(button0, "class", "btn btn-default btn-circle button-left svelte-fnj9rc");
    			add_location(button0, file, 210, 3, 4682);
    			attr_dev(span, "class", "descr svelte-fnj9rc");
    			add_location(span, file, 211, 3, 4787);
    			attr_dev(button1, "class", "btn btn-default btn-circle button-right svelte-fnj9rc");
    			add_location(button1, file, 212, 3, 4907);
    			attr_dev(div0, "class", "button-row svelte-fnj9rc");
    			add_location(div0, file, 209, 2, 4654);
    			attr_dev(div1, "class", "col-sm-12");
    			add_location(div1, file, 208, 2, 4628);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file, 207, 2, 4608);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(span, t5);
    			append_dev(span, t6);
    			append_dev(div0, t7);
    			append_dev(div0, button1);
    			append_dev(div2, t9);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", click_handler, false, false, false),
    				listen_dev(button1, "click", click_handler_1, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*products, lang*/ 5 && t2_value !== (t2_value = /*prod*/ ctx[34].description[/*lang*/ ctx[0]] + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*products*/ 4 && t4_value !== (t4_value = /*prod*/ ctx[34].price.toFixed(2) + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*locations, products, order*/ 38 && t6_value !== (t6_value = /*getQuantity*/ ctx[9](/*loc*/ ctx[31], /*prod*/ ctx[34], /*order*/ ctx[5]) + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(207:2) {#each products as prod}",
    		ctx
    	});

    	return block;
    }

    // (194:1) {#each locations as loc}
    function create_each_block(ctx) {
    	let div4;
    	let div3;
    	let img;
    	let img_src_value;
    	let t0;
    	let each_blocks_1 = [];
    	let each0_lookup = new Map();
    	let t1;
    	let div2;
    	let div1;
    	let div0;
    	let t2_value = /*loc*/ ctx[31].description[/*lang*/ ctx[0]] + "";
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	let each_value_2 = /*getCandles*/ ctx[13](/*loc*/ ctx[31], /*order*/ ctx[5]);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*candle*/ ctx[37].key;
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value_1 = /*products*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			img = element("img");
    			t0 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t2 = text(t2_value);
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			if (img.src !== (img_src_value = /*loc*/ ctx[31].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-fnj9rc");
    			add_location(img, file, 196, 2, 4148);
    			attr_dev(div0, "class", "col-md-12 icon-header svelte-fnj9rc");
    			add_location(div0, file, 204, 3, 4505);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 203, 2, 4484);
    			attr_dev(div2, "class", "button-group svelte-fnj9rc");
    			add_location(div2, file, 202, 2, 4455);
    			attr_dev(div3, "class", "candle-location svelte-fnj9rc");
    			add_location(div3, file, 195, 2, 4116);
    			attr_dev(div4, "class", "col-md-4 col-sm-12");
    			add_location(div4, file, 194, 2, 4081);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, img);
    			append_dev(div3, t0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div3, null);
    			}

    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div2, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div4, t4);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*locations*/ 2 && img.src !== (img_src_value = /*loc*/ ctx[31].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*getCandles, locations, order*/ 8226) {
    				const each_value_2 = /*getCandles*/ ctx[13](/*loc*/ ctx[31], /*order*/ ctx[5]);
    				validate_each_argument(each_value_2);
    				group_outros();
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_2, each0_lookup, div3, outro_and_destroy_block, create_each_block_2, t1, get_each_context_2);
    				check_outros();
    			}

    			if ((!current || dirty[0] & /*locations, lang*/ 3) && t2_value !== (t2_value = /*loc*/ ctx[31].description[/*lang*/ ctx[0]] + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*increment, locations, products, getQuantity, order, lang, decrement*/ 6695) {
    				each_value_1 = /*products*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(194:1) {#each locations as loc}",
    		ctx
    	});

    	return block;
    }

    // (228:0) {#if thanks}
    function create_if_block(ctx) {
    	let div;
    	let t_value = /*thankYouMessage*/ ctx[4][/*lang*/ ctx[0]] + "";
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "row thanks svelte-fnj9rc");
    			add_location(div, file, 228, 0, 5421);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*thankYouMessage, lang*/ 17) && t_value !== (t_value = /*thankYouMessage*/ ctx[4][/*lang*/ ctx[0]] + "")) set_data_dev(t, t_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(228:0) {#if thanks}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div0;
    	let t0;
    	let div4;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let t3_value = /*total*/ ctx[6].toFixed(2) + "";
    	let t3;
    	let t4;
    	let div3;
    	let button;
    	let i;
    	let t5;
    	let t6;
    	let script;
    	let script_src_value;
    	let current;
    	let dispose;
    	let each_value = /*locations*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*thanks*/ ctx[8] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = text("$");
    			t3 = text(t3_value);
    			t4 = space();
    			div3 = element("div");
    			button = element("button");
    			i = element("i");
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			script = element("script");
    			attr_dev(div0, "class", "row");
    			add_location(div0, file, 192, 0, 4015);
    			attr_dev(div1, "id", "paypal-button-container");
    			attr_dev(div1, "class", "col-sm-6 paypal-ugly svelte-fnj9rc");
    			add_location(div1, file, 223, 1, 5138);
    			attr_dev(div2, "class", "amount col-sm-3 svelte-fnj9rc");
    			add_location(div2, file, 224, 1, 5209);
    			attr_dev(i, "class", "fa fa-times");
    			add_location(i, file, 225, 94, 5358);
    			attr_dev(button, "class", "btn btn-circle btn-danger cancel svelte-fnj9rc");
    			add_location(button, file, 225, 23, 5287);
    			attr_dev(div3, "class", "col-sm-3");
    			add_location(div3, file, 225, 1, 5265);
    			attr_dev(div4, "class", "row total svelte-fnj9rc");
    			toggle_class(div4, "flex", /*total*/ ctx[6] > 0);
    			add_location(div4, file, 222, 0, 5090);
    			if (script.src !== (script_src_value = "https://www.paypal.com/sdk/js?client-id=" + /*paypalClientId*/ ctx[3] + "&currency=USD&disable-funding=card,credit")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "data-sdk-integration-source", "button-factory");
    			add_location(script, file, 233, 0, 5514);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			/*div0_binding*/ ctx[30](div0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, t2);
    			append_dev(div2, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, i);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			append_dev(document.head, script);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button, "click", /*clearOrder*/ ctx[10], false, false, false),
    				listen_dev(script, "load", /*initializePayPal*/ ctx[14], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*products, increment, locations, getQuantity, order, lang, decrement, getCandles*/ 14887) {
    				each_value = /*locations*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty[0] & /*total*/ 64) && t3_value !== (t3_value = /*total*/ ctx[6].toFixed(2) + "")) set_data_dev(t3, t3_value);

    			if (dirty[0] & /*total*/ 64) {
    				toggle_class(div4, "flex", /*total*/ ctx[6] > 0);
    			}

    			if (/*thanks*/ ctx[8]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*thanks*/ 256) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t6.parentNode, t6);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*paypalClientId*/ 8 && script.src !== (script_src_value = "https://www.paypal.com/sdk/js?client-id=" + /*paypalClientId*/ ctx[3] + "&currency=USD&disable-funding=card,credit")) {
    				attr_dev(script, "src", script_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			/*div0_binding*/ ctx[30](null);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t6);
    			detach_dev(script);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { lang = "ru" } = $$props;
    	let { locations = [] } = $$props;
    	let { products = [] } = $$props;
    	let { paypalClientId } = $$props;
    	let { brandName = {} } = $$props;
    	let { thankYouMessage = {} } = $$props;
    	let order = {};
    	const getQuantity = (loc, prod) => order[loc.id + "/" + prod.id] || 0;

    	const computeTotal = () => {
    		let temp = 0;

    		for (const loc of locations) {
    			for (const prod of products) {
    				const quantity = getQuantity(loc, prod);
    				temp += quantity * prod.price;
    			}
    		}

    		return temp;
    	};

    	let total = 0;

    	const clearOrder = () => {
    		$$invalidate(5, order = {});
    	};

    	const increment = (loc, prod) => {
    		const quantity = getQuantity(loc, prod);

    		if (quantity < prod.limit) {
    			$$invalidate(5, order[loc.id + "/" + prod.id] = quantity + 1, order);
    			$$invalidate(5, order);
    		}
    	};

    	const decrement = (loc, prod) => {
    		const quantity = getQuantity(loc, prod);

    		if (quantity > 0) {
    			$$invalidate(5, order[loc.id + "/" + prod.id] = quantity - 1, order);
    			$$invalidate(5, order);
    		}
    	};

    	const shuffle = array => {
    		for (let i = array.length - 1; i > 0; i--) {
    			const j = Math.floor(Math.random() * i);
    			const temp = array[i];
    			array[i] = array[j];
    			array[j] = temp;
    		}

    		return array;
    	};

    	const maxCandles = products.reduce((a, b) => a + b.limit, 0);
    	const positions = {};

    	function shuffleCandlePositions() {
    		for (const loc of locations) {
    			positions[loc.id] = {
    				pos: shuffle([...Array(maxCandles).keys()]),
    				rotation: [...Array(maxCandles).keys()].map(() => Math.random() * 10 - 5)
    			};
    		}
    	}

    	const getCandles = loc => {
    		const candles = [];
    		var pos_index = 0;

    		for (const prod of products) {
    			const q = getQuantity(loc, prod);

    			for (let i = 0; i < q; i++) {
    				candles.push({
    					image: prod.image,
    					pos: 100 * (0.5 + positions[loc.id].pos[pos_index + i]) / maxCandles,
    					height: prod.height,
    					rotate: positions[loc.id].rotation[pos_index + i],
    					key: loc.id + "/" + (pos_index + i)
    				});
    			}

    			pos_index += prod.limit;
    		}

    		return candles;
    	};

    	let paypalReady = false;
    	let mounted = false;
    	let element;

    	onMount(() => {
    		mounted = true;

    		if (paypalReady) {
    			loadPayPalButton();
    		}
    	});

    	function initializePayPal() {
    		paypalReady = true;

    		if (mounted) {
    			loadPayPalButton();
    		}
    	}

    	function createOrder(data, actions) {
    		const items = [];

    		for (const loc of locations) {
    			for (const prod of products) {
    				const q = getQuantity(loc, prod);

    				if (q > 0) {
    					items.push({
    						name: "candles",
    						sku: prod.id + "/" + loc.id,
    						unit_amount: {
    							currency_code: "USD",
    							value: prod.price.toFixed(2)
    						},
    						quantity: q,
    						description: prod.description[lang] + " :: " + loc.description[lang],
    						category: "DIGITAL_GOODS"
    					});
    				}
    			}
    		}

    		const purchase_unit = {
    			amount: {
    				currency_code: "USD",
    				value: total.toFixed(2),
    				breakdown: {
    					item_total: {
    						currency_code: "USD",
    						value: total.toFixed(2)
    					}
    				}
    			},
    			description: "Candles",
    			items
    		};

    		return actions.order.create({
    			purchase_units: [purchase_unit],
    			application_context: { brand_name: brandName[lang] }
    		});
    	}

    	function onApprove(data, actions) {
    		return actions.order.capture().then(function (details) {
    			// console.log(details.payer);
    			// console.log(details);
    			// alert('Transaction completed by ' + details.payer.name.given_name + '!');
    			clearOrder();

    			sayThanks();
    		});
    	}

    	const onCancel = data => {
    		console.log("Cancelled:", data);
    	};

    	function loadPayPalButton() {
    		paypal.Buttons({
    			style: {
    				size: "responsive",
    				shape: "pill",
    				color: "blue",
    				layout: "vertical",
    				label: "paypal",
    				tagline: false
    			},
    			createOrder,
    			onApprove,
    			onCancel
    		}).render("#paypal-button-container");
    	}

    	let thanks = false;

    	function sayThanks() {
    		$$invalidate(8, thanks = true);

    		setTimeout(
    			() => {
    				$$invalidate(8, thanks = false);
    			},
    			2500
    		);
    	}

    	const writable_props = [
    		"lang",
    		"locations",
    		"products",
    		"paypalClientId",
    		"brandName",
    		"thankYouMessage"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<CandleBox> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("CandleBox", $$slots, []);
    	const click_handler = (loc, prod) => decrement(loc, prod);
    	const click_handler_1 = (loc, prod) => increment(loc, prod);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("lang" in $$props) $$invalidate(0, lang = $$props.lang);
    		if ("locations" in $$props) $$invalidate(1, locations = $$props.locations);
    		if ("products" in $$props) $$invalidate(2, products = $$props.products);
    		if ("paypalClientId" in $$props) $$invalidate(3, paypalClientId = $$props.paypalClientId);
    		if ("brandName" in $$props) $$invalidate(15, brandName = $$props.brandName);
    		if ("thankYouMessage" in $$props) $$invalidate(4, thankYouMessage = $$props.thankYouMessage);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		fly,
    		lang,
    		locations,
    		products,
    		paypalClientId,
    		brandName,
    		thankYouMessage,
    		order,
    		getQuantity,
    		computeTotal,
    		total,
    		clearOrder,
    		increment,
    		decrement,
    		shuffle,
    		maxCandles,
    		positions,
    		shuffleCandlePositions,
    		getCandles,
    		paypalReady,
    		mounted,
    		element,
    		initializePayPal,
    		createOrder,
    		onApprove,
    		onCancel,
    		loadPayPalButton,
    		thanks,
    		sayThanks
    	});

    	$$self.$inject_state = $$props => {
    		if ("lang" in $$props) $$invalidate(0, lang = $$props.lang);
    		if ("locations" in $$props) $$invalidate(1, locations = $$props.locations);
    		if ("products" in $$props) $$invalidate(2, products = $$props.products);
    		if ("paypalClientId" in $$props) $$invalidate(3, paypalClientId = $$props.paypalClientId);
    		if ("brandName" in $$props) $$invalidate(15, brandName = $$props.brandName);
    		if ("thankYouMessage" in $$props) $$invalidate(4, thankYouMessage = $$props.thankYouMessage);
    		if ("order" in $$props) $$invalidate(5, order = $$props.order);
    		if ("total" in $$props) $$invalidate(6, total = $$props.total);
    		if ("paypalReady" in $$props) paypalReady = $$props.paypalReady;
    		if ("mounted" in $$props) mounted = $$props.mounted;
    		if ("element" in $$props) $$invalidate(7, element = $$props.element);
    		if ("thanks" in $$props) $$invalidate(8, thanks = $$props.thanks);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*order, total*/ 96) {
    			 {
    				$$invalidate(6, total = computeTotal());
    				if (total === 0) shuffleCandlePositions();
    			}
    		}
    	};

    	return [
    		lang,
    		locations,
    		products,
    		paypalClientId,
    		thankYouMessage,
    		order,
    		total,
    		element,
    		thanks,
    		getQuantity,
    		clearOrder,
    		increment,
    		decrement,
    		getCandles,
    		initializePayPal,
    		brandName,
    		positions,
    		paypalReady,
    		mounted,
    		computeTotal,
    		shuffle,
    		maxCandles,
    		shuffleCandlePositions,
    		createOrder,
    		onApprove,
    		onCancel,
    		loadPayPalButton,
    		sayThanks,
    		click_handler,
    		click_handler_1,
    		div0_binding
    	];
    }

    class CandleBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				lang: 0,
    				locations: 1,
    				products: 2,
    				paypalClientId: 3,
    				brandName: 15,
    				thankYouMessage: 4
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CandleBox",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*paypalClientId*/ ctx[3] === undefined && !("paypalClientId" in props)) {
    			console_1.warn("<CandleBox> was created without expected prop 'paypalClientId'");
    		}
    	}

    	get lang() {
    		throw new Error("<CandleBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lang(value) {
    		throw new Error("<CandleBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get locations() {
    		throw new Error("<CandleBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set locations(value) {
    		throw new Error("<CandleBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get products() {
    		throw new Error("<CandleBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set products(value) {
    		throw new Error("<CandleBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get paypalClientId() {
    		throw new Error("<CandleBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set paypalClientId(value) {
    		throw new Error("<CandleBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get brandName() {
    		throw new Error("<CandleBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set brandName(value) {
    		throw new Error("<CandleBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get thankYouMessage() {
    		throw new Error("<CandleBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set thankYouMessage(value) {
    		throw new Error("<CandleBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    exports.CandleBox = CandleBox;

    return exports;

}({}));
//# sourceMappingURL=online-candle-box.js.map
