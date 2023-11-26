--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

-- Started on 2023-11-27 00:13:23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 8 (class 2615 OID 16574)
-- Name: social_media; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA social_media;


ALTER SCHEMA social_media OWNER TO postgres;

--
-- TOC entry 873 (class 1247 OID 16740)
-- Name: chat_type; Type: TYPE; Schema: social_media; Owner: postgres
--

CREATE TYPE social_media.chat_type AS ENUM (
    'GROUP',
    'DIRECT_MESSAGE'
);


ALTER TYPE social_media.chat_type OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 16575)
-- Name: create_dm_on_friend_insert(); Type: FUNCTION; Schema: social_media; Owner: postgres
--

CREATE FUNCTION social_media.create_dm_on_friend_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$DECLARE 
	new_chat_id uuid;
BEGIN
  
  INSERT INTO social_media.chats(chat_type) VALUES ('DIRECT_MESSAGE') RETURNING chat_id INTO new_chat_id;
  
  new.chat_id = new_chat_id;
  INSERT INTO social_media.chat_members VALUES (new_chat_id, NEW.friend_one);
	INSERT INTO social_media.chat_members VALUES (new_chat_id, NEW.friend_two);
	return new;
END;$$;


ALTER FUNCTION social_media.create_dm_on_friend_insert() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 218 (class 1259 OID 16576)
-- Name: chat_members; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.chat_members (
    chat uuid NOT NULL,
    "user" uuid NOT NULL
);


ALTER TABLE social_media.chat_members OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16579)
-- Name: chats; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.chats (
    chat_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chat_type social_media.chat_type NOT NULL
);


ALTER TABLE social_media.chats OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16583)
-- Name: friends; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.friends (
    friend_one uuid NOT NULL,
    friend_two uuid NOT NULL,
    chat_id uuid
);


ALTER TABLE social_media.friends OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16586)
-- Name: messages; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.messages (
    message_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content character varying NOT NULL,
    owner uuid NOT NULL,
    chat uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT LOCALTIMESTAMP NOT NULL
);


ALTER TABLE social_media.messages OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16593)
-- Name: users; Type: TABLE; Schema: social_media; Owner: postgres
--

CREATE TABLE social_media.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    salt character varying,
    active boolean DEFAULT false,
    profile_picture character varying,
    username character varying NOT NULL
);


ALTER TABLE social_media.users OWNER TO postgres;

--
-- TOC entry 4671 (class 2606 OID 16600)
-- Name: friends CHK_friends_are_different; Type: CHECK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE social_media.friends
    ADD CONSTRAINT "CHK_friends_are_different" CHECK ((friend_one <> friend_two)) NOT VALID;


--
-- TOC entry 4675 (class 2606 OID 16602)
-- Name: chats chat_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chats
    ADD CONSTRAINT chat_pkey PRIMARY KEY (chat_id);


--
-- TOC entry 4673 (class 2606 OID 16604)
-- Name: chat_members chat_user_pair; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT chat_user_pair PRIMARY KEY (chat, "user");


--
-- TOC entry 4677 (class 2606 OID 16606)
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (friend_one, friend_two);


--
-- TOC entry 4679 (class 2606 OID 16608)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4681 (class 2606 OID 16610)
-- Name: users user_pkey; Type: CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4689 (class 2620 OID 16762)
-- Name: friends insert_dm_users_into_chat; Type: TRIGGER; Schema: social_media; Owner: postgres
--

CREATE TRIGGER insert_dm_users_into_chat BEFORE INSERT ON social_media.friends FOR EACH ROW EXECUTE FUNCTION social_media.create_dm_on_friend_insert();


--
-- TOC entry 4682 (class 2606 OID 16612)
-- Name: chat_members chat; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT chat FOREIGN KEY (chat) REFERENCES social_media.chats(chat_id) NOT VALID;


--
-- TOC entry 4687 (class 2606 OID 16617)
-- Name: messages chat; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT chat FOREIGN KEY (chat) REFERENCES social_media.chats(chat_id);


--
-- TOC entry 4684 (class 2606 OID 16757)
-- Name: friends chat; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT chat FOREIGN KEY (chat_id) REFERENCES social_media.chats(chat_id) NOT VALID;


--
-- TOC entry 4685 (class 2606 OID 16622)
-- Name: friends friend_one; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friend_one FOREIGN KEY (friend_one) REFERENCES social_media.users(user_id);


--
-- TOC entry 4686 (class 2606 OID 16627)
-- Name: friends friend_two; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friend_two FOREIGN KEY (friend_two) REFERENCES social_media.users(user_id);


--
-- TOC entry 4688 (class 2606 OID 16632)
-- Name: messages owner; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT owner FOREIGN KEY (owner) REFERENCES social_media.users(user_id);


--
-- TOC entry 4683 (class 2606 OID 16637)
-- Name: chat_members user; Type: FK CONSTRAINT; Schema: social_media; Owner: postgres
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES social_media.users(user_id) NOT VALID;


-- Completed on 2023-11-27 00:13:23

--
-- PostgreSQL database dump complete
--

