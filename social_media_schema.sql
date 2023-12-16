--
-- PostgreSQL database dump
--

-- Dumped from database version 16.0
-- Dumped by pg_dump version 16.0

-- Started on 2023-12-17 04:44:58

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
-- Name: social_media; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA social_media;


--
-- TOC entry 2 (class 3079 OID 16384)
-- Name: adminpack; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS adminpack WITH SCHEMA pg_catalog;


--
-- TOC entry 4864 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION adminpack; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION adminpack IS 'administrative functions for PostgreSQL';


--
-- TOC entry 3 (class 3079 OID 16483)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 4865 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 876 (class 1247 OID 16740)
-- Name: chat_type; Type: TYPE; Schema: social_media; Owner: -
--

CREATE TYPE social_media.chat_type AS ENUM (
    'GROUP',
    'DIRECT_MESSAGE'
);


--
-- TOC entry 882 (class 1247 OID 16834)
-- Name: member_type; Type: TYPE; Schema: social_media; Owner: -
--

CREATE TYPE social_media.member_type AS ENUM (
    'OWNER',
    'MEMBER'
);


--
-- TOC entry 246 (class 1255 OID 16575)
-- Name: create_dm_on_friend_insert(); Type: FUNCTION; Schema: social_media; Owner: -
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


--
-- TOC entry 247 (class 1255 OID 16819)
-- Name: remove_dm_on_friend_delete(); Type: FUNCTION; Schema: social_media; Owner: -
--

CREATE FUNCTION social_media.remove_dm_on_friend_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN

DELETE FROM social_media.messages WHERE chat = old.chat_id;
DELETE FROM social_media.chat_members WHERE chat = old.chat_id;
DELETE FROM social_media.chats WHERE chat_id = old.chat_id; 

return new;

END; 
	
	$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16840)
-- Name: chat_invites; Type: TABLE; Schema: social_media; Owner: -
--

CREATE TABLE social_media.chat_invites (
    chat_invite_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    inviter uuid NOT NULL,
    invitee uuid NOT NULL,
    chat uuid NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 16576)
-- Name: chat_members; Type: TABLE; Schema: social_media; Owner: -
--

CREATE TABLE social_media.chat_members (
    chat uuid NOT NULL,
    "user" uuid NOT NULL,
    type social_media.member_type DEFAULT 'MEMBER'::social_media.member_type NOT NULL
);


--
-- TOC entry 219 (class 1259 OID 16579)
-- Name: chats; Type: TABLE; Schema: social_media; Owner: -
--

CREATE TABLE social_media.chats (
    chat_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    chat_type social_media.chat_type NOT NULL,
    name character varying,
    chat_picture character varying
);


--
-- TOC entry 223 (class 1259 OID 16800)
-- Name: friend_requests; Type: TABLE; Schema: social_media; Owner: -
--

CREATE TABLE social_media.friend_requests (
    friend_request_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    requester uuid NOT NULL,
    requestee uuid NOT NULL
);


--
-- TOC entry 220 (class 1259 OID 16583)
-- Name: friends; Type: TABLE; Schema: social_media; Owner: -
--

CREATE TABLE social_media.friends (
    friend_one uuid NOT NULL,
    friend_two uuid NOT NULL,
    chat_id uuid
);


--
-- TOC entry 221 (class 1259 OID 16586)
-- Name: messages; Type: TABLE; Schema: social_media; Owner: -
--

CREATE TABLE social_media.messages (
    message_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    content character varying NOT NULL,
    owner uuid NOT NULL,
    chat uuid NOT NULL,
    "timestamp" timestamp with time zone DEFAULT LOCALTIMESTAMP NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 16593)
-- Name: users; Type: TABLE; Schema: social_media; Owner: -
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


--
-- TOC entry 4686 (class 2606 OID 16600)
-- Name: friends CHK_friends_are_different; Type: CHECK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE social_media.friends
    ADD CONSTRAINT "CHK_friends_are_different" CHECK ((friend_one <> friend_two)) NOT VALID;


--
-- TOC entry 4701 (class 2606 OID 16845)
-- Name: chat_invites chat_invites_pkey; Type: CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chat_invites
    ADD CONSTRAINT chat_invites_pkey PRIMARY KEY (chat_invite_id);


--
-- TOC entry 4691 (class 2606 OID 16602)
-- Name: chats chat_pkey; Type: CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chats
    ADD CONSTRAINT chat_pkey PRIMARY KEY (chat_id);


--
-- TOC entry 4689 (class 2606 OID 16604)
-- Name: chat_members chat_user_pair; Type: CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT chat_user_pair PRIMARY KEY (chat, "user");


--
-- TOC entry 4699 (class 2606 OID 16805)
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (friend_request_id);


--
-- TOC entry 4693 (class 2606 OID 16606)
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (friend_one, friend_two);


--
-- TOC entry 4695 (class 2606 OID 16608)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4687 (class 2606 OID 16816)
-- Name: friend_requests requester and requester are different; Type: CHECK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE social_media.friend_requests
    ADD CONSTRAINT "requester and requester are different" CHECK ((requester <> requestee)) NOT VALID;


--
-- TOC entry 4697 (class 2606 OID 16610)
-- Name: users user_pkey; Type: CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.users
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4714 (class 2620 OID 16762)
-- Name: friends insert_dm_users_into_chat; Type: TRIGGER; Schema: social_media; Owner: -
--

CREATE TRIGGER insert_dm_users_into_chat BEFORE INSERT ON social_media.friends FOR EACH ROW EXECUTE FUNCTION social_media.create_dm_on_friend_insert();


--
-- TOC entry 4715 (class 2620 OID 16820)
-- Name: friends remove_dm_on_friend_delete; Type: TRIGGER; Schema: social_media; Owner: -
--

CREATE TRIGGER remove_dm_on_friend_delete AFTER DELETE ON social_media.friends FOR EACH ROW EXECUTE FUNCTION social_media.remove_dm_on_friend_delete();


--
-- TOC entry 4702 (class 2606 OID 16612)
-- Name: chat_members chat; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT chat FOREIGN KEY (chat) REFERENCES social_media.chats(chat_id) NOT VALID;


--
-- TOC entry 4707 (class 2606 OID 16617)
-- Name: messages chat; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT chat FOREIGN KEY (chat) REFERENCES social_media.chats(chat_id);


--
-- TOC entry 4704 (class 2606 OID 16757)
-- Name: friends chat; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT chat FOREIGN KEY (chat_id) REFERENCES social_media.chats(chat_id) NOT VALID;


--
-- TOC entry 4711 (class 2606 OID 16856)
-- Name: chat_invites chat; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chat_invites
    ADD CONSTRAINT chat FOREIGN KEY (chat) REFERENCES social_media.chats(chat_id);


--
-- TOC entry 4705 (class 2606 OID 16622)
-- Name: friends friend_one; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friend_one FOREIGN KEY (friend_one) REFERENCES social_media.users(user_id);


--
-- TOC entry 4706 (class 2606 OID 16627)
-- Name: friends friend_two; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.friends
    ADD CONSTRAINT friend_two FOREIGN KEY (friend_two) REFERENCES social_media.users(user_id);


--
-- TOC entry 4712 (class 2606 OID 16851)
-- Name: chat_invites invitee; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chat_invites
    ADD CONSTRAINT invitee FOREIGN KEY (invitee) REFERENCES social_media.users(user_id);


--
-- TOC entry 4713 (class 2606 OID 16846)
-- Name: chat_invites inviter; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chat_invites
    ADD CONSTRAINT inviter FOREIGN KEY (inviter) REFERENCES social_media.users(user_id);


--
-- TOC entry 4708 (class 2606 OID 16632)
-- Name: messages owner; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.messages
    ADD CONSTRAINT owner FOREIGN KEY (owner) REFERENCES social_media.users(user_id);


--
-- TOC entry 4709 (class 2606 OID 16811)
-- Name: friend_requests requestee; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.friend_requests
    ADD CONSTRAINT requestee FOREIGN KEY (requestee) REFERENCES social_media.users(user_id);


--
-- TOC entry 4710 (class 2606 OID 16806)
-- Name: friend_requests requester; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.friend_requests
    ADD CONSTRAINT requester FOREIGN KEY (requester) REFERENCES social_media.users(user_id);


--
-- TOC entry 4703 (class 2606 OID 16637)
-- Name: chat_members user; Type: FK CONSTRAINT; Schema: social_media; Owner: -
--

ALTER TABLE ONLY social_media.chat_members
    ADD CONSTRAINT "user" FOREIGN KEY ("user") REFERENCES social_media.users(user_id) NOT VALID;


-- Completed on 2023-12-17 04:44:58

--
-- PostgreSQL database dump complete
--

